import { supabase } from "@/lib/supabase";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get("user_id");

  if (!user_id) {
    return Response.json({ error: "No user_id provided" }, { status: 400 });
  }

  const { data: saved, error: savedError } = await supabase
    .from("saved_recipes")
    .select("recipe_id, created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (savedError) {
    console.error("Error fetching saved recipes:", savedError.message);
    return Response.json({ error: savedError.message }, { status: 500 });
  }

  if (!saved || saved.length === 0) {
    return Response.json({ recipes: [] });
  }

  const ids = saved.map(s => s.recipe_id);
  const { data: recipes, error: recipesError } = await supabase
    .from("recipes")
    .select("*")
    .in("id", ids);

  if (recipesError) {
    console.error("Error fetching recipes:", recipesError.message);
    return Response.json({ error: recipesError.message }, { status: 500 });
  }

  return Response.json({ recipes: recipes || [] });
}
