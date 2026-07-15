import "./globals.css";

export const metadata = {
  title: "Cut to the Recipe — No story, just ingredients and instructions",
  description: "Paste any recipe URL and get back just the ingredients and steps. No life stories, no ads, no scrolling. Cut to the Recipe.",
  keywords: "recipe extractor, cut to the recipe, clean recipes, recipe without story",
  verification: {
    google: "y5p3sXkgmt7wrzJYvoPuUoZ1omKxC_igwCcslBIFssU",
  },
  openGraph: {
    title: "Cut to the Recipe",
    description: "Paste any recipe URL. Get just the ingredients and instructions.",
    url: "https://cuttotherecipe.com",
    siteName: "Cut to the Recipe",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cut to the Recipe" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="impact-site-verification" value="75c44d88-4095-45e3-be92-ddc147514a19" />
      </head>
      <body style={{margin: 0, padding: 0, background: "white", color: "#111827", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>
        {children}
      </body>
    </html>
  );
}
