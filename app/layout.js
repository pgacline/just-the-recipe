import "./globals.css";

export const metadata = {
  title: "Just the Recipe",
  description: "Paste any recipe URL. Get just the ingredients and instructions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body className="bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
