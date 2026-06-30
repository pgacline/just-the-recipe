"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
  const [url, setUrl] = useState("");
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExtract = useCallback(async (targetUrl) => {
    const urlToUse = targetUrl || url;
    if (!urlToUse) return;
    setLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const res = await fetch(`/api/extract?url=${encodeURIComponent(urlToUse)}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setRecipe(data);
      }
    } catch (e) {
      setError("Something went wrong. Try a different URL.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  // Auto-extract if a URL was passed in (e.g. from the browser extension)
  useEffect(() => {
    const paramUrl = searchParams.get("url");
    if (paramUrl) {
      setUrl(paramUrl);
      handleExtract(paramUrl);
    }
  }, [searchParams]);

  function handleKeyDown(e) {
    if (e.key === "Enter") handleExtract();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 to-white">
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            just the <span className="text-emerald-600">recipe</span>
          </h1>
          <p className="text-gray-500 text-lg">
            Paste any recipe URL. We'll strip out the story.
          </p>
        </div>

        <div className="flex gap-2 mb-10">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com/some-recipe"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          <button
            onClick={() => handleExtract()}
            disabled={loading}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition shadow-sm"
          >
            {loading ? "Extracting..." : "Extract recipe"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {loading && <SkeletonCard />}

        {!loading && recipe && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">{recipe.title}</h2>
            <div className="flex gap-4 text-sm text-gray-500 mb-7">
              {recipe.servings && (
                <span className="flex items-center gap-1">🍽 {recipe.servings} servings</span>
              )}
              {recipe.time && (
                <span className="flex items-center gap-1">⏱ {recipe.time}</span>
              )}
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-3">
              Ingredients
            </h3>
            <ul className="space-y-2 mb-8">
              {recipe.ingredients?.map((ing, i) => (
                <li key={i} className="text-sm text-gray-700 border-b border-gray-100 pb-2 last:border-0">
                  {ing}
                </li>
              ))}
            </ul>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-3">
              Instructions
            </h3>
            <ol className="space-y-4">
              {recipe.steps?.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
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
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-emerald-50/40 to-white" />}>
      <HomeContent />
    </Suspense>
  );
}
