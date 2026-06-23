//THE ACTUAL LITTLE RECIPE CARD COMPONENT USED IN THE RECIPE SCREEN
import { StarRating } from "../ui/StarRating";
import { formatTime } from "../../models/recipe";

export function RecipeCard({ recipe, onSelect, active, onToggleFavorite }) {
  return (
    <div
      onClick={() => onSelect(recipe)}
      style={{
        background: "white", borderRadius: "var(--r-lg)",
        boxShadow: active
          ? "0 0 0 2.5px var(--fire), var(--shadow-md)"
          : "var(--shadow-card)",
        overflow: "hidden", cursor: "pointer",
        border: active ? "none" : "1.5px solid transparent",
        transition: "transform 0.18s, box-shadow 0.18s",
        transform: active ? "translateY(-2px)" : "none",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.transform = "none"; }}
    >
      {/* Color swatch */}
      <div style={{ height: 100, background: recipe.color, position: "relative", display: "flex", alignItems: "flex-end", padding: 10 }}>
        {recipe.favorite && (
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(recipe.id); }}
            style={{
              position: "absolute", top: 10, right: 10,
              fontSize: 16, background: "none", border: "none",
              cursor: "pointer", color: "red",
            }}
          >♥</button>
        )}
        <span style={{
          fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
          background: "rgba(255,255,255,0.22)", backdropFilter: "blur(4px)",
          color: "white", padding: "3px 8px", borderRadius: 999,
        }}>{recipe.category}</span>
      </div>

      <div style={{ padding: "12px 14px 14px" }}>
        <h3 style={{
          fontFamily: "var(--font-display)", fontSize: 15.5, fontWeight: 600,
          color: "var(--ink)", marginBottom: 7, lineHeight: 1.3,
        }}>
          {recipe.name}
        </h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
            ⏱ {formatTime(recipe.prepTime, recipe.cookTime)}
          </span>
          <StarRating rating={recipe.rating || 0} size="sm" />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {(recipe.tags || []).slice(0, 3).map(t => (
            <span key={t} style={{
              fontSize: 10.5, padding: "2px 7px", borderRadius: 999,
              background: "var(--surface)", color: "var(--ink-soft)",
              border: "1px solid var(--border)", fontWeight: 500,
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
