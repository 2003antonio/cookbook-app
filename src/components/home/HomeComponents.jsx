import { StarRating } from "../ui/StarRating";
import { formatTime } from "../../models/recipe";

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
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)", zIndex: 90, animation: "fadeIn 0.2s ease" }} />

      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, maxHeight: "80vh", background: "var(--card-bg)", borderRadius: "24px 24px 0 0", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)", zIndex: 91, display: "flex", flexDirection: "column", animation: "slideUp 0.36s cubic-bezier(0.4,0,0.2,1)" }}>

        {/* Header */}
        <div style={{ background: "var(--card-bg)", borderRadius: "24px 24px 0 0", padding: "22px 20px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fire)", marginBottom: 4 }}>Favourites</p>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--ink)", lineHeight: 1.2 }}>Choose a recipe</h2>
              <p style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 4 }}>Tap ☆ to add it to your favourites</p>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--surface)", color: "var(--ink-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>✕</button>
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {recipes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 24px 24px" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📖</div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--ink)", marginBottom: 6 }}>No recipes yet</p>
              <p style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 22, lineHeight: 1.5 }}>Add a recipe first, then come back here to favourite it.</p>
              <button onClick={() => { onClose(); onNewRecipe(); }} style={{ padding: "12px 28px", background: "var(--fire)", color: "white", borderRadius: "var(--r-full)", fontSize: 14, fontWeight: 600, boxShadow: "0 4px 14px rgba(232,98,26,0.35)" }}>+ Add a recipe</button>
            </div>
          ) : (
            <div style={{ padding: "8px 16px 28px", display: "flex", flexDirection: "column", gap: 8 }}>
              {recipes.map(r => (
                <button
                  key={r.id}
                  onClick={() => onToggleFavorite(r.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    width: "100%", textAlign: "left",
                    padding: "10px 12px", borderRadius: "var(--r-md)",
                    background: r.favorite ? "var(--fire-glow)" : "transparent",
                    border: r.favorite ? "1.5px solid rgba(232,98,26,0.2)" : "1.5px solid transparent",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={e => { if (!r.favorite) e.currentTarget.style.background = "var(--surface)"; }}
                  onMouseLeave={e => { if (!r.favorite) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Color swatch */}
                  <div style={{ width: 46, height: 46, borderRadius: "var(--r-sm)", background: r.color, flexShrink: 0, boxShadow: "var(--shadow-sm)" }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>{r.category} · {formatTime(r.prepTime, r.cookTime)}</div>
                  </div>

                  {/* Star */}
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: r.favorite ? "var(--fire)" : "var(--surface)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, color: r.favorite ? "white" : "var(--ink-faint)",
                    transition: "background 0.15s, color 0.15s",
                    boxShadow: r.favorite ? "0 2px 8px rgba(232,98,26,0.4)" : "none",
                  }}>
                    {r.favorite ? "★" : "☆"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </>
  );
}
