// ── ConfirmDialog ─────────────────────────────────────────────────────────────
// Small centered "are you sure?" card — icon, title, subtitle, two pill buttons.
// Used for destructive / unsaved-changes confirmations (delete, discard, exit).
export function ConfirmDialog({ icon, iconBg, title, subtitle, cancelLabel, confirmLabel, onCancel, onConfirm }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(3px)", zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{
        background: "white", borderRadius: "var(--r-lg)", width: "100%", maxWidth: 300,
        boxShadow: "var(--shadow-lg)", padding: "24px 22px", textAlign: "center",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%", background: iconBg, margin: "0 auto 12px",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19,
        }}>{icon}</div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16.5, fontWeight: 600, marginBottom: 4 }}>{title}</h3>
        <p style={{ fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 18 }}>{subtitle}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "9px 0", background: "#FBDADA", color: "#B42318", borderRadius: "var(--r-full)", fontSize: 13, fontWeight: 600 }}
          >{cancelLabel}</button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: "9px 0", background: "#C8EAC4", color: "#15803D", borderRadius: "var(--r-full)", fontSize: 13, fontWeight: 600 }}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
