"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm animate-pulse">
      <div className="h-7 bg-gray-200 rounded-md w-2/3 mb-3"></div>
      <div className="flex gap-4 mb-7">
        <div className="h-4 bg-gray-200 rounded-md w-20"></div>
        <div className="h-4 bg-gray-200 rounded-md w-16"></div>
      </div>
      <div className="h-3 bg-emerald-100 rounded-md w-24 mb-3"></div>
      <div className="space-y-2 mb-8">
        <div className="h-4 bg-gray-200 rounded-md w-full"></div>
        <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded-md w-full"></div>
        <div className="h-4 bg-gray-200 rounded-md w-4/6"></div>
        <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
      </div>
      <div className="h-3 bg-emerald-100 rounded-md w-28 mb-3"></div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded-md w-full"></div>
              <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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

    try {
      const res = await fetch(`/api/extract?url=${encodeURIComponent(urlToUse)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setRecipe(data);
        if (data.id) setCurrentRecipeId(data.id);
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
    if (!currentRecipeId) { 
      console.log("No recipe ID available:", currentRecipeId);
      return; 
    }
    console.log("Saving recipe:", currentRecipeId, "for user:", user.id);
    setSaveLoading(true);
    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, recipe_id: currentRecipeId }),
    });
    const data = await res.json();
    console.log("Save result:", data);
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

  return (
    <div className="min-h-screen" style={{background: "white"}}>
      <nav style={{background: "white", borderBottom: "1px solid #e5e7eb"}} className="max-w-full px-6 py-4 flex justify-between items-center">
        <span style={{color: "#111827"}} className="font-bold text-lg">just the <span style={{color: "#059669"}}>recipe</span></span>
        <div className="flex gap-3 items-center">
          {user ? (
            <>
              <button
                onClick={() => router.push("/saved")}
                style={{color: "#111827", background: "#f3f4f6", border: "1px solid #d1d5db"}}
                className="text-sm px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Saved recipes
              </button>
              <button
                onClick={handleSignOut}
                style={{color: "#111827", background: "#f3f4f6", border: "1px solid #d1d5db"}}
                className="text-sm px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/auth")}
              style={{background: "#059669", color: "white"}}
              className="text-sm px-4 py-2 rounded-xl font-medium hover:opacity-90 transition"
            >
              Sign in
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-3" style={{color: "#111827"}}>
            just the <span style={{color: "#059669"}}>recipe</span>
          </h1>
          <p className="text-lg" style={{color: "#6b7280"}}>Paste any recipe URL. We'll strip out the story.</p>
        </div>

        <div className="flex gap-2 mb-10">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com/some-recipe"
            style={{color: "#111827", background: "white", border: "1px solid #d1d5db"}}
            className="flex-1 rounded-xl px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={() => handleExtract()}
            disabled={loading}
            style={{background: "#059669", color: "white"}}
            className="px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition shadow-sm"
          >
            {loading ? "Extracting..." : "Extract recipe"}
          </button>
        </div>

        {error && (
          <div style={{background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c"}} className="px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {loading && <SkeletonCard />}

        {!loading && recipe && (
          <div style={{background: "white", border: "1px solid #e5e7eb"}} className="rounded-2xl p-8 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-2xl font-bold flex-1" style={{color: "#111827"}}>{recipe.title}</h2>
              <button
                onClick={handleSave}
                disabled={saveLoading || saved}
                style={{
                  background: saved ? "#ecfdf5" : "#f3f4f6",
                  color: saved ? "#059669" : "#374151",
                  border: saved ? "1px solid #a7f3d0" : "1px solid #d1d5db"
                }}
                className="ml-4 flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                {saved ? "✓ Saved" : saveLoading ? "Saving..." : "♡ Save"}
              </button>
            </div>
            <div className="flex gap-4 text-sm mb-7" style={{color: "#6b7280"}}>
              {recipe.servings && <span>🍽 {recipe.servings} servings</span>}
              {recipe.time && <span>⏱ {recipe.time}</span>}
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{color: "#059669"}}>Ingredients</h3>
            <ul className="space-y-2 mb-8">
              {recipe.ingredients?.map((ing, i) => (
                <li key={i} className="text-sm pb-2" style={{color: "#374151", borderBottom: "1px solid #f3f4f6"}}>{ing}</li>
              ))}
            </ul>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{color: "#059669"}}>Instructions</h3>
            <ol className="space-y-4">
              {recipe.steps?.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{color: "#374151"}}>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center mt-0.5" style={{background: "#ecfdf5", color: "#059669"}}>{i + 1}</span>
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
    <Suspense fallback={<div style={{background: "white"}} className="min-h-screen" />}>
      <HomeContent />
    </Suspense>
  );
}
