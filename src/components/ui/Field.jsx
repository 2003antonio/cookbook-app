// Generic labeled form field wrapper used throughout RecipeForm.
export function Field({ label, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <label style={{
        fontSize: 11.5, fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.07em",
        color: "var(--ink-faint)",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}
