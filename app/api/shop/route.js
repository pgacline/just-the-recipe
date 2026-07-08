export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ingredients = searchParams.get("ingredients");
  const title = searchParams.get("title");

  if (!ingredients) {
    return Response.json({ error: "No ingredients provided" }, { status: 400 });
  }

  const ingredientList = JSON.parse(decodeURIComponent(ingredients));
  
  // Build an Instacart search URL for the recipe
  const query = encodeURIComponent(title || "recipe ingredients");
  const instacartUrl = `https://www.instacart.com/store/search_v3/term?term=${query}`;

  return Response.json({ url: instacartUrl, ingredients: ingredientList });
}
