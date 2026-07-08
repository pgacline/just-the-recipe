import "./globals.css";

export const metadata = {
  title: "Just the Recipe — No story, just ingredients and instructions",
  description: "Paste any recipe URL and get back just the ingredients and steps. No life stories, no ads, no scrolling. Just the recipe.",
  keywords: "recipe extractor, just the recipe, clean recipes, recipe without story",
  openGraph: {
    title: "Just the Recipe",
    description: "Paste any recipe URL. Get just the ingredients and instructions.",
    url: "https://just-the-recipe-delta.vercel.app",
    siteName: "Just the Recipe",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{margin: 0, padding: 0, background: "white", color: "#111827", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>
        {children}
      </body>
    </html>
  );
}
