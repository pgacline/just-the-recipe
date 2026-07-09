export default function manifest() {
  return {
    name: "Just the Recipe",
    short_name: "Just the Recipe",
    description: "Paste any recipe URL. Get just the ingredients and instructions.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
