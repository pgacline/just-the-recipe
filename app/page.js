"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";

function SkeletonCard() {
  return (
    <div style={{background: "white", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)"}}>
      <div style={{height: "28px", background: "#e5e7eb", borderRadius: "8px", width: "66%", marginBottom: "12px"}}></div>
      <div style={{display: "flex", gap: "16px", marginBottom: "28px"}}>
        <div style={{height: "16px", background: "#e5e7eb", borderRadius: "8px", width: "80px"}}></div>
        <div style={{height: "16px", background: "#e5e7eb", borderRadius: "8px", width: "64px"}}></div>
      </div>
      <div style={{height: "12px", background: "#d1fae5", borderRadius: "8px", width: "96px", marginBottom: "12px"}}></div>
      <div style={{display: "flex", flexDirection: "column", gap: "8px", marginBottom: "32px"}}>
        {[100, 83, 100, 66, 75].map((w, i) => (
          <div key={i} style={{height: "16px", background: "#e5e7eb", borderRadius: "8px", width: `${w}%`}}></div>
        ))}
      </div>
      <div style={{height: "12px", background: "#d1fae5", borderRadius: "8px", width: "112px", marginBottom: "12px"}}></div>
      <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
        {[1,2,3,4].map((i) => (
          <div key={i} style={{display: "flex", gap: "12px"}}>
            <div style={{flexShrink: 0, width: "24px", height: "24px", borderRadius: "50%", background: "#e5e7eb"}}></div>
            <div style={{flex: 1, display: "flex", flexDirection: "column", gap: "8px"}}>
              <div style={{height: "16px", background: "#e5e7eb", borderRadius: "8px", width: "100%"}}></div>
              <div style={{height: "16px", background: "#e5e7eb", borderRadius: "8px", width: "75%"}}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const MULTIPLIERS = [0.5, 1, 2, 3];

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

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [currentRecipeId, setCurrentRecipeId] = useState(null);
  const [multiplierIndex, setMultiplierIndex] = useState(1);
  const [baseServings, setBaseServings] = useState(4);

  const currentMultiplier = MULTIPLIERS[multiplierIndex];
  const currentServings = Math.max(1, Math.round(baseServings * currentMultiplier));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleExtract = useCallback(async (targetUrl) => {
    const urlToUse = targetUrl || url;
    if (!urlToUse) return;
    setLoading(true);
    setError(null);
    setRecipe(null);
    setSaved(false);
    setCurrentRecipeId(null);
    setMultiplierIndex(1);

    try {
      const res = await fetch(`/api/extract?url=${encodeURIComponent(urlToUse)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setRecipe(data);
        if (data.id) setCurrentRecipeId(data.id);
        setBaseServings(parseInt(data.servings) || 4);
      }
    } catch (e) {
      setError("Something went wrong. Try a different URL.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    const paramUrl = searchParams.get("url");
    if (paramUrl) {
      setUrl(paramUrl);
      handleExtract(paramUrl);
    }
  }, [searchParams]);

  async function handleSave() {
    if (!user) { router.push("/auth"); return; }
    if (!currentRecipeId) return;
    setSaveLoading(true);
    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, recipe_id: currentRecipeId }),
    });
    const data = await res.json();
    if (!data.error) setSaved(true);
    setSaveLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleExtract();
  }

  function handlePrint() {
    if (!recipe) return;
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

  const multiplierLabels = ["½x", "1x", "2x", "3x"];

  return (
    <div style={{background: "white", minHeight: "100vh"}}>
      <nav style={{background: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <span style={{color: "#111827", fontWeight: "700", fontSize: "18px"}}>just the <span style={{color: "#059669"}}>recipe</span></span>
        <div style={{display: "flex", gap: "12px", alignItems: "center"}}>
          {user ? (
            <>
              <button onClick={() => router.push("/saved")} style={{color: "#111827", background: "#f3f4f6", border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: "500", cursor: "pointer"}}>Saved recipes</button>
              <button onClick={handleSignOut} style={{color: "#111827", background: "#f3f4f6", border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: "500", cursor: "pointer"}}>Sign out</button>
            </>
          ) : (
            <button onClick={() => router.push("/auth")} style={{background: "#059669", color: "white", border: "none", padding: "8px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: "500", cursor: "pointer"}}>Sign in</button>
          )}
        </div>
      </nav>

      <main style={{maxWidth: "672px", margin: "0 auto", padding: "40px 24px"}}>
        <div style={{textAlign: "center", marginBottom: "40px"}}>
          <h1 style={{fontSize: "36px", fontWeight: "700", color: "#111827", marginBottom: "12px"}}>
            just the <span style={{color: "#059669"}}>recipe</span>
          </h1>
          <p style={{color: "#6b7280", fontSize: "18px"}}>Paste any recipe URL. We'll strip out the story.</p>
        </div>

        <div style={{display: "flex", gap: "8px", marginBottom: "40px"}}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com/some-recipe"
            style={{flex: 1, border: "1px solid #d1d5db", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: "#111827", background: "white", outline: "none"}}
          />
          <button
            onClick={() => handleExtract()}
            disabled={loading}
            style={{background: "#059669", color: "white", border: "none", padding: "12px 24px", borderRadius: "12px", fontSize: "14px", fontWeight: "500", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1}}
          >
            {loading ? "Extracting..." : "Extract recipe"}
          </button>
        </div>

        {error && (
          <div style={{background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "12px 16px", borderRadius: "12px", fontSize: "14px", marginBottom: "24px"}}>
            {error}
          </div>
        )}

        {loading && <SkeletonCard />}

        {!loading && recipe && (
          <div style={{background: "white", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)"}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px"}}>
              <h2 style={{fontSize: "24px", fontWeight: "700", color: "#111827", margin: 0, flex: 1}}>{recipe.title}</h2>
              <div style={{display: "flex", gap: "8px", marginLeft: "16px", flexShrink: 0}}>
                <button
                  onClick={handlePrint}
                  style={{background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", padding: "8px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: "500", cursor: "pointer"}}
                >
                  🖨 Print
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveLoading || saved}
                  style={{background: saved ? "#ecfdf5" : "#f3f4f6", color: saved ? "#059669" : "#374151", border: saved ? "1px solid #a7f3d0" : "1px solid #d1d5db", padding: "8px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: "500", cursor: "pointer"}}
                >
                  {saved ? "✓ Saved" : saveLoading ? "Saving..." : "♡ Save"}
                </button>
              </div>
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
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{background: "white", minHeight: "100vh"}} />}>
      <HomeContent />
    </Suspense>
  );
}
