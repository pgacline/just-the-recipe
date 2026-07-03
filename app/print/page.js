"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function PrintContent() {
  const searchParams = useSearchParams();
  
  let recipe = null;
  try {
    const data = searchParams.get("data");
    if (data) recipe = JSON.parse(decodeURIComponent(data));
  } catch (e) {
    console.error("Failed to parse recipe data");
  }

  useEffect(() => {
    if (recipe) {
      setTimeout(() => window.print(), 500);
    }
  }, []);

  if (!recipe) {
    return <div style={{padding: "40px", color: "#111827"}}>No recipe data found.</div>;
  }

  return (
    <div style={{maxWidth: "600px", margin: "0 auto", padding: "40px 24px", fontFamily: "Georgia, serif", color: "#111827", background: "white"}}>
      <h1 style={{fontSize: "28px", fontWeight: "700", marginBottom: "8px", color: "#111827"}}>{recipe.title}</h1>
      
      <div style={{display: "flex", gap: "20px", marginBottom: "24px", fontSize: "14px", color: "#6b7280"}}>
        {recipe.time && <span>⏱ {recipe.time}</span>}
        {recipe.servings && <span>🍽 {recipe.servings} servings</span>}
      </div>

      <hr style={{border: "none", borderTop: "1px solid #e5e7eb", marginBottom: "24px"}} />

      <h2 style={{fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "#059669", marginBottom: "12px"}}>Ingredients</h2>
      <ul style={{listStyle: "none", padding: 0, margin: "0 0 28px 0"}}>
        {recipe.ingredients?.map((ing, i) => (
          <li key={i} style={{fontSize: "14px", padding: "6px 0", borderBottom: "1px solid #f3f4f6", color: "#374151"}}>{ing}</li>
        ))}
      </ul>

      <h2 style={{fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "#059669", marginBottom: "12px"}}>Instructions</h2>
      <ol style={{listStyle: "none", padding: 0, margin: 0}}>
        {recipe.steps?.map((step, i) => (
          <li key={i} style={{display: "flex", gap: "12px", marginBottom: "14px", fontSize: "14px", lineHeight: "1.65", color: "#374151"}}>
            <span style={{flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center"}}>{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <div style={{marginTop: "40px", paddingTop: "16px", borderTop: "1px solid #e5e7eb", fontSize: "12px", color: "#9ca3af", textAlign: "center"}}>
        just-the-recipe-delta.vercel.app
      </div>
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div style={{padding: "40px"}}>Loading...</div>}>
      <PrintContent />
    </Suspense>
  );
}
