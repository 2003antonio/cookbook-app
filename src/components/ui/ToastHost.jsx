import { useState, useEffect } from "react";

// Tiny pub-sub so any component can fire a toast without prop-threading.
// Mount <ToastHost /> once near the root of the app.
let toastListeners = [];

export function showToast(message) {
  toastListeners.forEach(fn => fn(message));
}

function subscribeToast(fn) {
  toastListeners = [...toastListeners, fn];
  return () => { toastListeners = toastListeners.filter(l => l !== fn); };
}

const TOAST_VISIBLE_MS = 2400;
const TOAST_EXIT_MS    = 220;

export function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => subscribeToast((message) => {
    const id = `toast${Date.now()}${Math.random()}`;
    setToasts(t => [...t, { id, message, leaving: false }]);
    setTimeout(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, leaving: true } : x));
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), TOAST_EXIT_MS);
    }, TOAST_VISIBLE_MS);
  }), []);

  if (!toasts.length) return null;

  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      zIndex: 999, display: "flex", flexDirection: "column-reverse", gap: 8,
      alignItems: "center", pointerEvents: "none",
    }}>
      <style>{`
        @keyframes toastIn  { from { opacity:0; transform:translateY(10px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes toastOut { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(6px) scale(0.96); } }
      `}</style>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--ink)", color: "white",
          padding: "10px 18px 10px 12px", borderRadius: "var(--r-full)",
          boxShadow: "var(--shadow-lg)", fontSize: 13.5, fontWeight: 500,
          whiteSpace: "nowrap",
          animation: `${t.leaving ? "toastOut" : "toastIn"} ${t.leaving ? TOAST_EXIT_MS : 220}ms ease forwards`,
        }}>
          <span style={{
            width: 20, height: 20, borderRadius: "50%", background: "var(--success)", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
              <path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
