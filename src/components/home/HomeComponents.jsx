import { StarRating } from "../ui/StarRating";
import { formatTime }  from "../../hooks/useRecipes";

// ── Recent Recipe Row ─────────────────────────────────────────────────────────
export function RecentRow({ recipe, onSelect }) {
  return (
    <button
      onClick={() => onSelect(recipe)}
      style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--border)", width: "100%", textAlign: "left", transition: "opacity 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      <div style={{ width: 48, height: 48, borderRadius: "var(--r-sm)", background: recipe.color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--ink)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {recipe.name}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
          {recipe.category} · {formatTime(recipe.prepTime, recipe.cookTime)}
        </div>
      </div>
      <StarRating rating={recipe.rating || 0} size="sm" />
    </button>
  );
}

// ── Favorite Picker Sheet ─────────────────────────────────────────────────────
// Lists existing recipes so the user can star one as a favorite.
export function FavoritePickerSheet({ recipes, onClose, onToggleFavorite, onNewRecipe }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)", zIndex: 90 }} />

      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, maxHeight: "80vh", background: "white", borderRadius: "24px 24px 0 0", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)", zIndex: 91, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700, color: "var(--ink)" }}>Add a favorite</h2>
            <p style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 3 }}>Tap a recipe to star it</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface)", color: "var(--ink-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ padding: "4px 20px 28px", overflowY: "auto" }}>
          {recipes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 8px 12px" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📖</div>
              <p style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)", marginBottom: 4 }}>No recipes yet</p>
              <p style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 18 }}>Add a recipe first, then come back here to favorite it</p>
              <button onClick={() => { onClose(); onNewRecipe(); }} style={{ padding: "11px 24px", background: "var(--fire)", color: "white", borderRadius: "var(--r-full)", fontSize: 14, fontWeight: 600 }}>+ Add a recipe</button>
            </div>
          ) : (
            recipes.map(r => (
              <button key={r.id} onClick={() => onToggleFavorite(r.id)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 44, height: 44, borderRadius: "var(--r-sm)", background: r.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>{r.category}</div>
                </div>
                <span style={{ fontSize: 19, color: r.favorite ? "var(--fire)" : "var(--ink-faint)", flexShrink: 0 }}>
                  {r.favorite ? "★" : "☆"}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
