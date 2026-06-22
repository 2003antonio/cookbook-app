import { useState, useRef, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import AuthModal  from "./AuthModal";

const AVATAR_SIZE = 38;

const avatarBaseStyle = {
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  borderRadius: "50%",
  border: "2px solid white",
  boxShadow: "var(--shadow-sm)",
  flexShrink: 0,
};

// ── Profile Button ───────────────────────────────────────────────────────────
// Renders inline wherever it's placed in the layout (no portal, no fixed
// positioning) so it scrolls and sits naturally within the page flow.
export default function ProfileButton({ session, loading }) {
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
            background: "white", border: "1px solid var(--border)",
            borderRadius: "var(--r-full)", padding: "9px 16px",
            fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600,
            color: "var(--ink)", boxShadow: "var(--shadow-sm)", flexShrink: 0,
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
          background: "white", borderRadius: "var(--r-md)",
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
          <button
            onClick={() => { setMenuOpen(false); supabase.auth.signOut(); }}
            style={{
              width: "100%", textAlign: "left", padding: "11px 14px",
              fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 500, color: "#B42318",
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
