"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SavedPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [removing, setRemoving] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push("/auth"); return; }
      setUser(session.user);
      fetchSaved(session.user.id);
    });
  }, []);

  async function fetchSaved(userId) {
    const res = await fetch(`/api/saved?user_id=${userId}`);
    const data = await res.json();
    setRecipes(data.recipes || []);
    setLoading(false);
  }

  async function handleRemove(e, recipeId) {
    e.stopPropagation();
    setRemoving(recipeId);
    const res = await fetch("/api/unsave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, recipe_id: recipeId }),
    });
    const data = await res.json();
    if (!data.error) {
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
    }
    setRemoving(null);
  }

  return (
    <div style={{background: "white", minHeight: "100vh"}}>
      <nav style={{background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <button
          onClick={() => router.push("/")}
          style={{fontWeight: "700", fontSize: "17px", color: "#111827", background: "none", border: "none", cursor: "pointer"}}
        >
          ← cut to the <span style={{color: "#059669"}}>recipe</span>
        </button>
        <button
          onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
          style={{color: "#111827", background: "#f3f4f6", border: "1px solid #d1d5db", padding: "7px 12px", borderRadius: "10px", fontSize: "13px", fontWeight: "500", cursor: "pointer"}}
        >
          Sign out
        </button>
      </nav>

      <main style={{maxWidth: "672px", margin: "0 auto", padding: "24px 16px"}}>
        <h2 style={{fontSize: "22px", fontWeight: "700", color: "#111827", marginBottom: "20px"}}>Saved recipes</h2>

        {loading && (
          <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
            {[1,2,3].map(i => (
              <div key={i} style={{height: "72px", background: "#f3f4f6", borderRadius: "12px"}} />
            ))}
          </div>
        )}

        {!loading && recipes.length === 0 && (
          <div style={{textAlign: "center", padding: "64px 0"}}>
            <p style={{fontSize: "18px", marginBottom: "8px", color: "#6b7280"}}>No saved recipes yet</p>
            <p style={{fontSize: "14px", color: "#9ca3af"}}>Extract a recipe and tap Save to add it here</p>
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
                style={{background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px"}}
              >
                <div
                  style={{flex: 1, cursor: "pointer"}}
                  onClick={() => router.push(`/?url=${encodeURIComponent(recipe.url)}`)}
                >
                  <h3 style={{fontWeight: "500", color: "#111827", margin: "0 0 4px 0", fontSize: "15px"}}>{recipe.title}</h3>
                  <div style={{display: "flex", gap: "12px", fontSize: "12px", color: "#9ca3af"}}>
                    {recipe.servings && <span>🍽 {recipe.servings} servings</span>}
                    {recipe.time && <span>⏱ {recipe.time}</span>}
                  </div>
                </div>
                <button
                  onClick={(e) => handleRemove(e, recipe.id)}
                  disabled={removing === recipe.id}
                  style={{background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", fontWeight: "500", cursor: "pointer", flexShrink: 0, opacity: removing === recipe.id ? 0.5 : 1}}
                >
                  {removing === recipe.id ? "..." : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
