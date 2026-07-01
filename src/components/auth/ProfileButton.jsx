import { useState, useRef, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import AuthModal  from "./AuthModal";

const AVATAR_SIZE = 38;

const avatarBaseStyle = {
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  borderRadius: "50%",
  border: "2px solid var(--card-bg)",
  boxShadow: "var(--shadow-sm)",
  flexShrink: 0,
};

// ── Profile Button ───────────────────────────────────────────────────────────
// Renders inline wherever it's placed in the layout (no portal, no fixed
// positioning) so it scrolls and sits naturally within the page flow.
export default function ProfileButton({ session, loading, theme, toggleTheme }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  if (loading) {
    return <div style={{ ...avatarBaseStyle, background: "var(--surface-2)" }} />;
  }

  if (!session) {
    return (
      <>
        <button
          onClick={() => setAuthOpen(true)}
          style={{
            background: "var(--fire)", border: "1px solid var(--fire)",
            borderRadius: "var(--r-full)", padding: "9px 16px",
            fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600,
            color: "white", boxShadow: "var(--shadow-sm)", flexShrink: 0,
          }}
        >
          Log in / Sign up
        </button>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </>
    );
  }

  const email = session.user?.email ?? "";
  const initial = email ? email.charAt(0).toUpperCase() : "?";

  return (
    <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        title={email}
        style={{
          ...avatarBaseStyle,
          background: "var(--fire)", color: "white",
          fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {initial}
      </button>

      {menuOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "var(--card-bg)", borderRadius: "var(--r-md)",
          border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)",
          minWidth: 200, overflow: "hidden", zIndex: 10,
        }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
            <div style={{
              fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-faint)",
              marginBottom: 2,
            }}>
              Signed in as
            </div>
            <div style={{
              fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600, color: "var(--ink)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {email}
            </div>
          </div>

          {/* Theme toggle row */}
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>
              {theme === "dark" ? "🌙 Dark mode" : "☀️ Light mode"}
            </span>
            <button
              onClick={toggleTheme}
              style={{
                width: 40, height: 22, borderRadius: 999, position: "relative", border: "none",
                background: theme === "light" ? "var(--fire)" : "var(--border)",
                cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: 3,
                left: theme === "light" ? 21 : 3,
                width: 16, height: 16, borderRadius: "50%",
                background: "white", transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              }} />
            </button>
          </div>

          <button
            onClick={() => { setMenuOpen(false); supabase.auth.signOut(); }}
            style={{
              width: "100%", textAlign: "left", padding: "11px 14px",
              fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 500, color: "var(--error)",
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
