"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MULTIPLIERS = [0.5, 1, 2, 3];
const multiplierLabels = ["½x", "1x", "2x", "3x"];

function scaleIngredient(ingredient, baseServings, currentServings) {
  if (!baseServings || baseServings === currentServings) return ingredient;
  const ratio = currentServings / baseServings;
  return ingredient.replace(/(\d+(\.\d+)?\/\d+|\d+\.\d+|\d+)/g, (match) => {
    let num;
    if (match.includes("/")) {
      const [a, b] = match.split("/");
      num = parseFloat(a) / parseFloat(b);
    } else {
      num = parseFloat(match);
    }
    const scaled = num * ratio;
    if (scaled === Math.floor(scaled)) return String(Math.floor(scaled));
    return (Math.round(scaled * 8) / 8).toFixed(2).replace(/\.?0+$/, "");
  });
}

export default function RecipeClient({ recipe }) {
  const router = useRouter();
  const [multiplierIndex, setMultiplierIndex] = useState(1);
  const baseServings = parseInt(recipe.servings) || 4;
  const currentServings = Math.max(1, Math.round(baseServings * MULTIPLIERS[multiplierIndex]));

  function handlePrint() {
    const scaledRecipe = {
      ...recipe,
      servings: currentServings,
      ingredients: recipe.ingredients.map(ing =>
        scaleIngredient(ing, baseServings, currentServings)
      ),
    };
    const printUrl = `/print?data=${encodeURIComponent(JSON.stringify(scaledRecipe))}`;
    window.open(printUrl, "_blank");
  }

  function handleShop() {
    if (!recipe) return;
    const title = encodeURIComponent(recipe.title + " ingredients");
    window.open(`https://www.instacart.com/store/search?k=${title}`, "_blank");
  }

  return (
    <div style={{background: "white", minHeight: "100vh"}}>
      <nav style={{background: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <button
          onClick={() => router.push("/")}
          style={{color: "#111827", fontWeight: "700", fontSize: "18px", background: "none", border: "none", cursor: "pointer"}}
        >
          just the <span style={{color: "#059669"}}>recipe</span>
        </button>
        <button
          onClick={() => router.push("/")}
          style={{color: "#111827", background: "#f3f4f6", border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: "500", cursor: "pointer"}}
        >
          ← Extract another
        </button>
      </nav>

      <main style={{maxWidth: "672px", margin: "0 auto", padding: "40px 24px"}}>
        <div style={{background: "white", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px"}}>
            <h1 style={{fontSize: "24px", fontWeight: "700", color: "#111827", margin: 0, flex: 1}}>{recipe.title}</h1>
            <button
              onClick={handlePrint}
              style={{background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", padding: "8px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: "500", cursor: "pointer", marginLeft: "16px", flexShrink: 0}}
            >
              🖨 Print
            </button>
          </div>

          <div style={{display: "flex", gap: "16px", alignItems: "center", marginBottom: "28px", flexWrap: "wrap"}}>
            {recipe.time && <span style={{fontSize: "14px", color: "#6b7280"}}>⏱ {recipe.time}</span>}
            <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
              <span style={{fontSize: "14px", color: "#6b7280"}}>🍽 {currentServings} servings</span>
              <button
                onClick={() => setMultiplierIndex(i => Math.max(0, i - 1))}
                disabled={multiplierIndex === 0}
                style={{width: "28px", height: "28px", borderRadius: "50%", border: "1px solid #d1d5db", background: "#f3f4f6", cursor: multiplierIndex === 0 ? "not-allowed" : "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", opacity: multiplierIndex === 0 ? 0.4 : 1}}
              >−</button>
              <span style={{fontSize: "14px", fontWeight: "600", color: "#059669", minWidth: "28px", textAlign: "center"}}>{multiplierLabels[multiplierIndex]}</span>
              <button
                onClick={() => setMultiplierIndex(i => Math.min(MULTIPLIERS.length - 1, i + 1))}
                disabled={multiplierIndex === MULTIPLIERS.length - 1}
                style={{width: "28px", height: "28px", borderRadius: "50%", border: "1px solid #d1d5db", background: "#f3f4f6", cursor: multiplierIndex === MULTIPLIERS.length - 1 ? "not-allowed" : "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", opacity: multiplierIndex === MULTIPLIERS.length - 1 ? 0.4 : 1}}
              >+</button>
            </div>
          </div>

          <h3 style={{fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.8px", color: "#059669", marginBottom: "12px"}}>Ingredients</h3>
          <ul style={{listStyle: "none", padding: 0, margin: "0 0 32px 0"}}>
            {recipe.ingredients?.map((ing, i) => (
              <li key={i} style={{fontSize: "14px", color: "#374151", borderBottom: "1px solid #f3f4f6", paddingBottom: "8px", marginBottom: "8px"}}>
                {scaleIngredient(ing, baseServings, currentServings)}
              </li>
            ))}
          </ul>

          <h3 style={{fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.8px", color: "#059669", marginBottom: "12px"}}>Instructions</h3>
          <ol style={{listStyle: "none", padding: 0, margin: 0}}>
            {recipe.steps?.map((step, i) => (
              <li key={i} style={{display: "flex", gap: "12px", marginBottom: "16px", fontSize: "14px", lineHeight: "1.65", color: "#374151"}}>
                <span style={{flexShrink: 0, width: "24px", height: "24px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "2px"}}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div style={{marginTop: "28px", paddingTop: "24px", borderTop: "1px solid #f3f4f6"}}>
            <button
              onClick={handleShop}
              style={{width: "100%", background: "#059669", color: "white", border: "none", padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer"}}
            >
              🛒 Shop this recipe on Instacart
            </button>
            <p style={{textAlign: "center", fontSize: "12px", color: "#9ca3af", marginTop: "8px", marginBottom: 0}}>
              We may earn a commission on purchases
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
