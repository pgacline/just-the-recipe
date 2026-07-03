"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
      }
    }
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div style={{background: "white", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px"}}>
      <div style={{width: "100%", maxWidth: "380px"}}>
        <h1 style={{fontSize: "28px", fontWeight: "700", textAlign: "center", marginBottom: "8px", color: "#111827"}}>
          just the <span style={{color: "#059669"}}>recipe</span>
        </h1>
        <p style={{color: "#6b7280", fontSize: "14px", textAlign: "center", marginBottom: "32px"}}>
          {isSignUp ? "Create an account to save recipes" : "Sign in to your account"}
        </p>

        <div style={{background: "white", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)"}}>
          <div style={{marginBottom: "12px"}}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Email address"
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "14px",
                color: "#111827",
                background: "white",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "8px",
                display: "block"
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Password"
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "14px",
                color: "#111827",
                background: "white",
                outline: "none",
                boxSizing: "border-box",
                display: "block"
              }}
            />
          </div>

          {error && (
            <div style={{background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "12px 16px", borderRadius: "12px", fontSize: "14px", marginBottom: "12px"}}>
              {error}
            </div>
          )}

          {message && (
            <div style={{background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "12px 16px", borderRadius: "12px", fontSize: "14px", marginBottom: "12px"}}>
              {message}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              background: "#059669",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "12px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
              marginBottom: "16px"
            }}
          >
            {loading ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
          </button>

          <p style={{textAlign: "center", fontSize: "14px", color: "#6b7280", margin: 0}}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
              style={{color: "#059669", fontWeight: "500", background: "none", border: "none", cursor: "pointer", fontSize: "14px"}}
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
