import { supabase } from "@/lib/supabase";

export default async function sitemap() {
  const baseUrl = "https://just-the-recipe-delta.vercel.app";

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  const recipeUrls = (recipes || []).map((recipe) => ({
    url: `${baseUrl}/recipe/${recipe.id}`,
    lastModified: recipe.created_at,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...recipeUrls,
  ];
}
