import { supabase } from "@/lib/supabase";

export async function POST(request) {
  try {
    const { user_id, recipe_id } = await request.json();
    
    console.log("Attempting to save:", { user_id, recipe_id });
    
    if (!user_id || !recipe_id) {
      return Response.json({ error: "Missing user_id or recipe_id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("saved_recipes")
      .insert({ user_id, recipe_id })
      .select()
      .single();

    if (error) {
      console.error("Save error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("Unexpected error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
