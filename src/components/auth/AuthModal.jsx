import { useState } from "react";
import { supabase } from "../../services/supabaseClient";

// ── Friendly error messages ───────────────────────────────────────────────────
function parseAuthError(message) {
  const m = message?.toLowerCase() ?? "";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return "Please enter a valid email address.";
  if (m.includes("invalid login credentials") || m.includes("invalid credentials"))
    return "Incorrect email or password. Please try again.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email before signing in. Check your inbox.";
  if (m.includes("password should be at least"))
    return "Password must be at least 6 characters.";
  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("email rate limit exceeded"))
    return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("network") || m.includes("fetch"))
    return "Network error. Please check your connection and try again.";
  return message; // fallback to raw message
}

// ── Modes: "signin" | "signup" | "forgot" | "signup-done" ────────────────────
export default function AuthModal({ onClose }) {
  const [mode,     setMode]     = useState("signin");
  const mouseDownOnBackdrop = { current: false };
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [message,  setMessage]  = useState(null);

  const reset = (nextMode) => {
    setError(null);
    setMessage(null);
    setMode(nextMode);
  };

  // ── Client-side email validation ──────────────────────────────────────────
  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { setError(parseAuthError(error.message)); return; }
      onClose(); // session picked up by onAuthStateChange

    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) { setError(parseAuthError(error.message)); return; }
      setMode("signup-done");

    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      setLoading(false);
      if (error) { setError(parseAuthError(error.message)); return; }
      setMessage("Password reset email sent — check your inbox.");
    }
  };

  // ── Titles & subtitles per mode ───────────────────────────────────────────
  const titles = {
    signin:       { heading: "Welcome back",        sub: "Sign in to access your recipes." },
    signup:       { heading: "Create your account", sub: "Save and organise your recipes in one place." },
    forgot:       { heading: "Reset password",      sub: "Enter your email and we'll send a reset link." },
    "signup-done": { heading: "Check your email",   sub: null },
  };
  const { heading, sub } = titles[mode];

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(3px)", zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onMouseDown={(e) => { mouseDownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (e.target === e.currentTarget && mouseDownOnBackdrop.current) onClose(); }}
    >
      <style>{`
        .auth-input:focus { outline: 2px solid var(--fire); outline-offset: 1px; }
        .auth-submit:disabled { opacity: 0.6; cursor: default; }
      `}</style>

      <div style={{
        background: "var(--card-bg)", borderRadius: "var(--r-lg)", width: "100%",
        maxWidth: 380, boxShadow: "var(--shadow-lg)", overflow: "hidden",
        padding: "28px 24px 24px",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{
              fontSize: 12.5, fontWeight: 600, color: "var(--fire)",
              letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6,
            }}>
              📖 Cookbook
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--ink)" }}>
              {heading}
            </h2>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: "50%", background: "var(--surface)",
            fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginLeft: 12,
          }}>✕</button>
        </div>

        {sub && (
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20, lineHeight: 1.5 }}>
            {sub}
          </p>
        )}

        {/* ── signup-done state ── */}
        {mode === "signup-done" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              background: "var(--success-bg)", border: "1px solid var(--success)",
              borderRadius: "var(--r-sm)", padding: "14px 12px",
              fontSize: 13.5, color: "var(--success)", lineHeight: 1.6,
            }}>
              ✉️ We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
            </div>
            <button
              onClick={() => reset("signin")}
              style={styles.submit}
            >
              ← Back to sign in
            </button>
          </div>
        )}

        {/* ── forms ── */}
        {mode !== "signup-done" && (
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

            {mode !== "forgot" && (
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
            )}

            {/* Forgot password link — only on signin */}
            {mode === "signin" && (
              <button
                type="button"
                onClick={() => reset("forgot")}
                style={{ alignSelf: "flex-end", fontSize: 12.5, color: "var(--fire)", marginTop: -8 }}
              >
                Forgot password?
              </button>
            )}

            {error   && <div style={styles.error}>{error}</div>}
            {message && <div style={styles.message}>{message}</div>}

            <button type="submit" disabled={loading} className="auth-submit" style={styles.submit}>
              {loading
                ? "Please wait…"
                : mode === "signin"  ? "Sign in"
                : mode === "signup"  ? "Create account"
                : "Send reset link"}
            </button>
          </form>
        )}

        {/* ── bottom nav links ── */}
        {mode === "signin" && (
          <button type="button" onClick={() => reset("signup")} style={styles.toggle}>
            Don't have an account? <span style={{ color: "var(--fire)", fontWeight: 600 }}>Sign up</span>
          </button>
        )}
        {mode === "signup" && (
          <button type="button" onClick={() => reset("signin")} style={styles.toggle}>
            Already have an account? <span style={{ color: "var(--fire)", fontWeight: 600 }}>Sign in</span>
          </button>
        )}
        {mode === "forgot" && (
          <button type="button" onClick={() => reset("signin")} style={styles.toggle}>
            ← Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  label: {
    display: "flex", flexDirection: "column", gap: 6,
    fontSize: 13, fontWeight: 600, color: "var(--ink-soft)",
  },
  input: {
    fontSize: 15, color: "var(--ink)",
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--r-sm)", padding: "10px 12px",
  },
  error: {
    fontSize: 13, color: "var(--error)",
    background: "var(--error-bg)", border: "1px solid var(--error)",
    borderRadius: "var(--r-sm)", padding: "8px 10px", lineHeight: 1.5,
  },
  message: {
    fontSize: 13, color: "var(--success)",
    background: "var(--success-bg)", border: "1px solid var(--success)",
    borderRadius: "var(--r-sm)", padding: "8px 10px", lineHeight: 1.5,
  },
  submit: {
    fontSize: 15, fontWeight: 600, color: "white",
    background: "var(--fire)", borderRadius: "var(--r-sm)", padding: "12px",
  },
  toggle: {
    width: "100%", textAlign: "center", marginTop: "var(--space-lg)",
    fontSize: 13.5, color: "var(--ink-faint)",
  },
};
