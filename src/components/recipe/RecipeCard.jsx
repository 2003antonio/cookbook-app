import { StarRating } from "../ui/StarRating";
import { formatTime, hexToRgba } from "../../models/recipe";

export function RecipeCard({ recipe, onSelect, active, onToggleFavorite }) {
  const hasImage   = !!recipe.image;
  const tint       = hexToRgba(recipe.color, 0.12);  // details band carries the card color
  const tintBorder = hexToRgba(recipe.color, 0.45);  // the "change of color" line under the name
  const tags       = (recipe.tags || []).slice(0, 3);

  return (
    <div
      onClick={() => onSelect(recipe)}
      style={{
        background: "var(--card-bg)", borderRadius: "var(--r-lg)",
        boxShadow: active
          ? "0 0 0 2.5px var(--fire), var(--shadow-md)"
          : "var(--shadow-card)",
        overflow: "hidden", cursor: "pointer",
        border: active ? "none" : "1.5px solid var(--border)",
        transition: "transform 0.18s, box-shadow 0.18s",
        transform: active ? "translateY(-2px)" : "none",
        display: "flex", flexDirection: "column", height: "100%",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.transform = "none"; }}
    >
      {/* Media — uploaded cover photo, or the card color as a fallback */}
      <div style={{ height: 116, flexShrink: 0, background: recipe.color, position: "relative", display: "flex", alignItems: "flex-end", padding: 10 }}>
        {hasImage && (
          <>
            <img src={recipe.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            {/* Bottom scrim keeps the category pill legible over photos */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent 55%)" }} />
          </>
        )}
        {recipe.favorite && (
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(recipe.id); }}
            style={{
              position: "absolute", top: 10, right: 10, zIndex: 2,
              fontSize: 16, background: "none", border: "none",
              cursor: "pointer", color: "red",
            }}
          >♥</button>
        )}
        <span style={{
          position: "relative", zIndex: 1,
          fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
          background: "rgba(255,255,255,0.22)", backdropFilter: "blur(4px)",
          color: "white", padding: "3px 8px", borderRadius: 999,
        }}>{recipe.category}</span>
      </div>

      {/* Name — sits on the plain card surface */}
      <div style={{ padding: "11px 14px 9px" }}>
        <h3 style={{
          fontFamily: "var(--font-display)", fontSize: 15.5, fontWeight: 600,
          color: "var(--ink)", lineHeight: 1.3,
        }}>
          {recipe.name}
        </h3>
      </div>

      {/* Footer group — pinned to the bottom of the card (marginTop:auto eats the
          slack), so the band + tags line up across every card in a grid row no
          matter how many tags each recipe has. */}
      <div style={{ marginTop: "auto" }}>
        {/* Details — tinted band with time + rating only (both always present, so its
            height never changes). Tags live outside it to keep the color block uniform. */}
        <div style={{
          padding: "9px 14px", background: tint,
          borderTop: `1px solid ${tintBorder}`, borderBottom: `1px solid ${tintBorder}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
            ⏱ {formatTime(recipe.prepTime, recipe.cookTime)}
          </span>
          <StarRating rating={recipe.rating || 0} size="sm" />
        </div>

        {/* Tags — on the plain card surface, below the color band (up to 3). When there
            are none, an invisible placeholder chip reserves exactly one tag row's worth
            of space so every card keeps the same breathing room under the band. */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "10px 14px 13px" }}>
          {tags.length > 0 ? (
            tags.map(t => (
              <span key={t} style={{
                fontSize: 10.5, padding: "2px 7px", borderRadius: 999,
                background: "var(--surface)", color: "var(--ink-soft)",
                border: "1px solid var(--border)", fontWeight: 500,
              }}>{t}</span>
            ))
          ) : (
            <span aria-hidden style={{
              fontSize: 10.5, padding: "2px 7px", borderRadius: 999,
              border: "1px solid transparent", fontWeight: 500, visibility: "hidden",
            }}>·</span>
          )}
        </div>
      </div>
    </div>
  );
}
