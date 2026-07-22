import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import * as cheerio from "cheerio";
import { supabase } from "@/lib/supabase";

const client = new Anthropic();

function normalizeIngredient(ing) {
  if (typeof ing === "string") return ing;
  if (ing && typeof ing === "object") {
    const parts = [ing.amount, ing.unit, ing.item || ing.name, ing.note].filter(Boolean);
    return parts.join(" ").trim();
  }
  return String(ing);
}

function normalizeStep(step) {
  if (typeof step === "string") return step;
  if (step && typeof step === "object") {
    return step.text || step.name || step.instruction || JSON.stringify(step);
  }
  return String(step);
}

function extractSchemaOrg(html) {
  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const raw = $(scripts[i]).html();
      if (!raw) continue;
      const data = JSON.parse(raw);

      // Handle arrays and nested @graph structures
      let recipes = [];
      if (Array.isArray(data)) {
        recipes = data.filter(d => d["@type"] === "Recipe");
        // Also check nested @graph
        data.forEach(d => {
          if (d["@graph"]) {
            recipes = recipes.concat(d["@graph"].filter(g => g["@type"] === "Recipe"));
          }
        });
      } else if (data["@type"] === "Recipe") {
        recipes = [data];
      } else if (data["@graph"]) {
        recipes = data["@graph"].filter(g => g["@type"] === "Recipe");
      }

      if (recipes.length > 0) {
        const recipe = recipes[0];
        return {
          title: recipe.name || "",
          servings: recipe.recipeYield || "",
          time: recipe.totalTime || recipe.cookTime || recipe.prepTime || "",
          ingredients: Array.isArray(recipe.recipeIngredient)
            ? recipe.recipeIngredient.map(normalizeIngredient)
            : [],
          steps: Array.isArray(recipe.recipeInstructions)
            ? recipe.recipeInstructions.map(normalizeStep)
            : [],
        };
      }
    } catch (e) { continue; }
  }
  return null;
}

function cleanHtmlForAI(html) {
  const $ = cheerio.load(html);

  // Remove all the junk
  $(
    "script, style, nav, footer, header, aside, iframe, noscript, " +
    ".ad, .ads, .advertisement, .sidebar, .comments, .comment, " +
    ".social-share, .newsletter, .popup, .modal, .cookie, " +
    ".related-posts, .related-recipes, .jump-to-recipe, " +
    "[class*='ad-'], [class*='sidebar'], [class*='popup'], " +
    "[class*='newsletter'], [class*='social'], [class*='share'], " +
    "[id*='ad-'], [id*='sidebar'], [id*='popup'], [id*='comments']"
  ).remove();

  // Remove images but keep their alt text as context
  $("img").each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt && alt.length > 3) {
      $(el).replaceWith(`<span>[image: ${alt}]</span>`);
    } else {
      $(el).remove();
    }
  });

  // Try to find the main recipe content area first
  const recipeSelectors = [
    "[class*='recipe']",
    "[id*='recipe']",
    "article",
    "main",
    ".entry-content",
    ".post-content",
    ".content",
  ];

  let content = "";
  for (const selector of recipeSelectors) {
    const el = $(selector).first();
    if (el.length && el.text().trim().length > 200) {
      content = el.text().replace(/\s+/g, " ").trim();
      break;
    }
  }

  // Fall back to full body if nothing found
  if (!content) {
    content = $("body").text().replace(/\s+/g, " ").trim();
  }

  // Limit to 10000 chars (up from 8000)
  return content.slice(0, 10000);
}

async function extractWithAI(html) {
  const cleanText = cleanHtmlForAI(html);

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `You are a recipe extraction expert. Extract the complete recipe from this webpage text.

IMPORTANT RULES:
- Extract ALL ingredients, even if the list seems long
- Extract ALL steps — do not stop early, get every single step even if there are many
- Steps may be scattered through the page with images between them — collect them all
- Ignore ads, comments, related recipes, and other non-recipe content
- Each ingredient and step must be a plain text string, never an object

Return ONLY a JSON object with these exact fields:
{
  "title": "recipe name",
  "servings": "number of servings as a string",
  "time": "total time as a string",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "steps": ["step 1", "step 2", "step 3"]
}

Return ONLY the raw JSON. No markdown, no code fences, no explanation.

Webpage text:
${cleanText}`
    }],
  });

  let text = message.content[0].text.trim();
  text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(text);
  return {
    ...parsed,
    ingredients: (parsed.ingredients || []).map(normalizeIngredient),
    steps: (parsed.steps || []).map(normalizeStep),
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) return Response.json({ error: "No URL provided" }, { status: 400 });

  try {
    const { data: existing } = await supabase
      .from("recipes")
      .select("*")
      .eq("url", url)
      .single();

    if (existing) {
      console.log("Found cached recipe for:", url);
      return Response.json({
        id: existing.id,
        title: existing.title,
        servings: existing.servings,
        time: existing.time,
        ingredients: (existing.ingredients || []).map(normalizeIngredient),
        steps: (existing.steps || []).map(normalizeStep),
        method: existing.method,
        cached: true,
      });
    }

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      timeout: 15000,
    });

    let recipe = extractSchemaOrg(response.data);
    let method = "schema.org";

    if (!recipe || recipe.ingredients.length === 0 || recipe.steps.length === 0) {
      console.log("Schema.org incomplete or missing, trying AI for:", url);
      recipe = await extractWithAI(response.data);
      method = "ai";
    }

    const { data: inserted, error: insertError } = await supabase
      .from("recipes")
      .insert({
        url,
        title: recipe.title,
        servings: String(recipe.servings || ""),
        time: recipe.time,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        method,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to save recipe to database:", insertError.message);
    }

    return Response.json({ ...recipe, id: inserted?.id, method, cached: false });

  } catch (error) {
    console.error("EXTRACTION ERROR for", url, ":", error.message);
    const status = error.response?.status;
    if (status === 403 || status === 401) {
      return Response.json(
        { error: "This site blocks automatic recipe extraction. Try a different site." },
        { status: 422 }
      );
    }
    if (status === 404) {
      return Response.json(
        { error: "That page couldn't be found. Double check the URL." },
        { status: 422 }
      );
    }
    if (error.code === "ECONNABORTED") {
      return Response.json(
        { error: "That site took too long to respond. Try again in a moment." },
        { status: 422 }
      );
    }
    return Response.json(
      { error: "Couldn't extract a recipe from that page. It may not contain a standard recipe format." },
      { status: 422 }
    );
  }
}
