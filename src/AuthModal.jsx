import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (mode === "signin") {
      // useAuth's onAuthStateChange listener picks up the new session
      // and the corner button swaps to the avatar automatically.
      onClose();
    } else {
      setMessage("Check your email to confirm your account, then sign in.");
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError(null);
    setMessage(null);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(3px)", zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        .auth-input:focus { outline: 2px solid var(--fire); outline-offset: 1px; }
        .auth-submit:disabled { opacity: 0.6; cursor: default; }
      `}</style>

      <div style={{
        background: "white", borderRadius: "var(--r-lg)", width: "100%",
        maxWidth: 380, boxShadow: "var(--shadow-lg)", overflow: "hidden",
        padding: "28px 24px 24px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{
              fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600,
              color: "var(--fire)", letterSpacing: "0.04em", textTransform: "uppercase",
              marginBottom: 6,
            }}>
              📖 Cookbook
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--ink)" }}>
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: "50%", background: "var(--surface)",
            fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginLeft: 12,
          }}>✕</button>
        </div>

        <p style={{
          fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-soft)",
          marginBottom: 20, lineHeight: 1.5,
        }}>
          {mode === "signin"
            ? "Sign in to access your recipes."
            : "Save and organize your recipes in one place."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label style={styles.label}>
            Email
            <input
              className="auth-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              className="auth-input"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </label>

          {error && <div style={styles.error}>{error}</div>}
          {message && <div style={styles.message}>{message}</div>}

          <button type="submit" disabled={loading} className="auth-submit" style={styles.submit}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button type="button" onClick={switchMode} style={styles.toggle}>
          {mode === "signin"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  label: {
    display: "flex", flexDirection: "column", gap: 6,
    fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--ink-soft)",
  },
  input: {
    fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)",
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--r-sm)", padding: "10px 12px",
  },
  error: {
    fontFamily: "var(--font-body)", fontSize: 13, color: "#B42318",
    background: "rgba(180,35,24,0.08)", border: "1px solid rgba(180,35,24,0.2)",
    borderRadius: "var(--r-sm)", padding: "8px 10px",
  },
  message: {
    fontFamily: "var(--font-body)", fontSize: 13, color: "#15803D",
    background: "rgba(21,128,61,0.08)", border: "1px solid rgba(21,128,61,0.2)",
    borderRadius: "var(--r-sm)", padding: "8px 10px",
  },
  submit: {
    fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, color: "white",
    background: "var(--fire)", borderRadius: "var(--r-sm)", padding: "12px",
  },
  toggle: {
    width: "100%", textAlign: "center", marginTop: "var(--space-lg)",
    fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink-faint)",
  },
};
