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
      const data = JSON.parse($(scripts[i]).html());
      const recipe = Array.isArray(data)
        ? data.find(d => d["@type"] === "Recipe")
        : data["@type"] === "Recipe" ? data : null;
      if (recipe) {
        return {
          title: recipe.name || "",
          servings: recipe.recipeYield || "",
          time: recipe.totalTime || recipe.cookTime || "",
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

async function extractWithAI(html) {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, aside").remove();
  const bodyText = $("body").text();
  const cleanText = bodyText.replace(/\s+/g, " ").trim().slice(0, 8000);
  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: "Extract the recipe from this text and return ONLY a JSON object with fields: title, servings, time, ingredients (array of plain text strings), steps (array of plain text strings). Return ONLY raw JSON, no markdown, no code fences. Text: " + cleanText
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
      timeout: 10000,
    });

    let recipe = extractSchemaOrg(response.data);
    let method = "schema.org";
    if (!recipe || recipe.ingredients.length === 0) {
      console.log("No schema.org data found, trying AI for:", url);
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
