// ── PartSelector ──────────────────────────────────────────────────────────────
// Pill row letting the user switch which part the Ingredients/Steps tab is
// scoped to. Shared by IngredientsTab and StepsTab; shown only for multi-part
// recipes (RecipeForm only renders it when `multiPart` is true).
export function PartSelector({ parts, activePartIdx, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
      {parts.map((part, idx) => (
        <button
          key={part.id}
          onClick={() => onSelect(idx)}
          style={{
            flexShrink: 0, padding: "5px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 5,
            background: activePartIdx === idx ? "var(--fire)" : "var(--surface)",
            color:      activePartIdx === idx ? "white"        : "var(--ink-soft)",
            border:     "none",
          }}
        >
          {part.icon && <span>{part.icon}</span>}
          {part.name || `Part ${idx + 1}`}
        </button>
      ))}
    </div>
  );
}
