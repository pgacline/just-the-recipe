import { supabase } from "@/lib/supabase";

export async function POST(request) {
  try {
    const { user_id, recipe_id } = await request.json();
    
    if (!user_id || !recipe_id) {
      return Response.json({ error: "Missing user_id or recipe_id" }, { status: 400 });
    }

    const { error } = await supabase
      .from("saved_recipes")
      .delete()
      .eq("user_id", user_id)
      .eq("recipe_id", recipe_id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
