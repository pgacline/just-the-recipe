"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SavedPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push("/auth"); return; }
      setUser(session.user);

      const res = await fetch(`/api/saved?user_id=${session.user.id}`);
      const data = await res.json();
      console.log("Saved recipes response:", data);
      setRecipes(data.recipes || []);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{background: "white", minHeight: "100vh"}}>
      <nav style={{background: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <button
          onClick={() => router.push("/")}
          style={{fontWeight: "700", fontSize: "18px", color: "#111827", background: "none", border: "none", cursor: "pointer"}}
        >
          just the <span style={{color: "#059669"}}>recipe</span>
        </button>
        <button
          onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
          style={{color: "#111827", background: "#f3f4f6", border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: "500", cursor: "pointer"}}
        >
          Sign out
        </button>
      </nav>

      <main style={{maxWidth: "672px", margin: "0 auto", padding: "40px 24px"}}>
        <h2 style={{fontSize: "24px", fontWeight: "700", color: "#111827", marginBottom: "24px"}}>Saved recipes</h2>

        {loading && (
          <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
            {[1,2,3].map(i => (
              <div key={i} style={{height: "64px", background: "#f3f4f6", borderRadius: "12px"}} />
            ))}
          </div>
        )}

        {!loading && recipes.length === 0 && (
          <div style={{textAlign: "center", padding: "64px 0"}}>
            <p style={{fontSize: "18px", marginBottom: "8px", color: "#6b7280"}}>No saved recipes yet</p>
            <p style={{fontSize: "14px", color: "#9ca3af"}}>Extract a recipe and click Save to add it here</p>
            <button
              onClick={() => router.push("/")}
              style={{marginTop: "16px", color: "#059669", fontSize: "14px", fontWeight: "500", background: "none", border: "none", cursor: "pointer"}}
            >
              Go extract a recipe →
            </button>
          </div>
        )}

        {!loading && recipes.length > 0 && (
          <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
            {recipes.map(recipe => (
              <div
                key={recipe.id}
                onClick={() => router.push(`/?url=${encodeURIComponent(recipe.url)}`)}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  cursor: "pointer"
                }}
              >
                <h3 style={{fontWeight: "500", color: "#111827", margin: "0 0 4px 0"}}>{recipe.title}</h3>
                <div style={{display: "flex", gap: "12px", fontSize: "12px", color: "#9ca3af"}}>
                  {recipe.servings && <span>🍽 {recipe.servings} servings</span>}
                  {recipe.time && <span>⏱ {recipe.time}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
