import { supabase } from "@/lib/supabase";
import RecipeClient from "./RecipeClient";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const recipeId = parseInt(id);
  
  const { data: recipe } = await supabase
    .from("recipes")
    .select("title, ingredients")
    .eq("id", recipeId)
    .single();

  if (!recipe) return { title: "Recipe not found" };

  return {
    title: `${recipe.title} — Just the Recipe`,
    description: `${recipe.title}: ${recipe.ingredients?.slice(0, 5).join(", ")} and more. No story, just the recipe.`,
  };
}

export default async function RecipePage({ params }) {
  const { id } = await params;
  const recipeId = parseInt(id);

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", recipeId)
    .single();

  console.log("Looking up recipe ID:", recipeId, "Result:", recipe?.title, "Error:", error?.message);

  if (!recipe) {
    return (
      <div style={{padding: "40px", textAlign: "center", color: "#111827"}}>
        <h1 style={{fontSize: "24px", fontWeight: "700", marginBottom: "8px"}}>Recipe not found</h1>
        <p style={{color: "#6b7280"}}>This recipe may have been removed or the link is incorrect.</p>
        <a href="/" style={{color: "#059669", marginTop: "16px", display: "inline-block"}}>← Back to home</a>
      </div>
    );
  }

  return <RecipeClient recipe={recipe} />;
}
