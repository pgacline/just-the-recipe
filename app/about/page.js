"use client";

import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div style={{background: "white", minHeight: "100vh"}}>
      <nav style={{background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <button
          onClick={() => router.push("/")}
          style={{color: "#111827", fontWeight: "700", fontSize: "17px", background: "none", border: "none", cursor: "pointer"}}
        >
          ← just the <span style={{color: "#059669"}}>recipe</span>
        </button>
      </nav>

      <main style={{maxWidth: "640px", margin: "0 auto", padding: "40px 24px"}}>
        <h1 style={{fontSize: "28px", fontWeight: "700", color: "#111827", marginBottom: "16px"}}>About</h1>

        <p style={{fontSize: "16px", lineHeight: "1.7", color: "#374151", marginBottom: "16px"}}>
          Just the Recipe exists because recipe websites are broken. You search for "chocolate chip cookies," click the first result, and spend the next two minutes scrolling past someone's childhood memories, a history of chocolate, and three paragraphs about how their grandmother would have loved these cookies — before finally finding the actual recipe buried at the bottom.
        </p>

        <p style={{fontSize: "16px", lineHeight: "1.7", color: "#374151", marginBottom: "16px"}}>
          We think that's backwards. The recipe should come first.
        </p>

        <p style={{fontSize: "16px", lineHeight: "1.7", color: "#374151", marginBottom: "32px"}}>
          Paste any recipe URL and we strip everything out — the ads, the stories, the popups — and give you just the ingredients and instructions. Clean, fast, and easy to read while you're actually cooking.
        </p>

        <h2 style={{fontSize: "20px", fontWeight: "700", color: "#111827", marginBottom: "12px"}}>Features</h2>
        <ul style={{listStyle: "none", padding: 0, margin: "0 0 32px 0"}}>
          {[
            "Extract any recipe from any URL",
            "Scale ingredients to ½x, 1x, 2x, or 3x",
            "Save your favourite recipes",
            "Clean print view for cooking",
            "Shop ingredients on Instacart",
            "Browser extension for one-click extraction",
            "Add to your phone's home screen",
          ].map((feature, i) => (
            <li key={i} style={{display: "flex", gap: "10px", marginBottom: "10px", fontSize: "15px", color: "#374151"}}>
              <span style={{color: "#059669", fontWeight: "600"}}>✓</span>
              {feature}
            </li>
          ))}
        </ul>

        <h2 style={{fontSize: "20px", fontWeight: "700", color: "#111827", marginBottom: "12px"}}>Feedback</h2>
        <p style={{fontSize: "15px", color: "#374151", marginBottom: "20px"}}>
          Found a bug? Have a suggestion? We'd love to hear from you.
        </p>

        <FeedbackForm />
      </main>
    </div>
  );
}

function FeedbackForm() {
  const [name, setName] = require("react").useState("");
  const [email, setEmail] = require("react").useState("");
  const [message, setMessage] = require("react").useState("");
  const [sent, setSent] = require("react").useState(false);
  const [loading, setLoading] = require("react").useState(false);

  async function handleSubmit() {
    if (!message) return;
    setLoading(true);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div style={{background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "12px", padding: "20px", textAlign: "center"}}>
        <p style={{color: "#065f46", fontWeight: "600", margin: 0}}>Thanks for your feedback! 🙏</p>
        <p style={{color: "#059669", fontSize: "14px", margin: "8px 0 0 0"}}>We read every message and really appreciate it.</p>
      </div>
    );
  }

  return (
    <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
        style={{border: "1px solid #d1d5db", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: "#111827", background: "white", outline: "none"}}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email (optional)"
        style={{border: "1px solid #d1d5db", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: "#111827", background: "white", outline: "none"}}
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Your feedback, bug report, or feature request..."
        rows={4}
        style={{border: "1px solid #d1d5db", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", color: "#111827", background: "white", outline: "none", resize: "vertical", fontFamily: "inherit"}}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !message}
        style={{background: "#059669", color: "white", border: "none", padding: "13px", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: loading || !message ? "not-allowed" : "pointer", opacity: loading || !message ? 0.5 : 1}}
      >
        {loading ? "Sending..." : "Send feedback"}
      </button>
    </div>
  );
}
