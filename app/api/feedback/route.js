import { supabase } from "@/lib/supabase";

export async function POST(request) {
  try {
    const { name, email, message } = await request.json();

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("feedback")
      .insert({ name, email, message });

    if (error) {
      console.error("Feedback error:", error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
