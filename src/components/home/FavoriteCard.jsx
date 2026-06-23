import { useState } from "react";
import { StarRating } from "../ui/StarRating";
import { formatTime } from "../../models/recipe";

export const CARD_W    = 280;
export const GAP       = 16;
export const CARD_STEP = CARD_W + GAP;

// Read-only card shown in the Favorites carousel.
export function FavoriteCard({ recipe, active, onSelect, dragDelta }) {
  const [hovered, setHovered] = useState(false);
  const scale = active ? 1.02 : 0.96;
  const lift  = hovered ? -3 : 0;

  return (
    <div
      onClick={() => { if (Math.abs(dragDelta.current) > 5) return; onSelect(recipe); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minWidth: CARD_W, width: CARD_W,
        background: "white", borderRadius: "var(--r-lg)",
        cursor: "pointer", overflow: "hidden",
        boxShadow: active ? "var(--shadow-lg)" : "var(--shadow-sm)",
        transform: `scale(${scale}) translateY(${lift}px)`,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        flexShrink: 0,
      }}
    >
      <div style={{ height: 110, background: recipe.color, display: "flex", alignItems: "flex-end", padding: 12 }}>
        <span style={{
          fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
          background: "rgba(255,255,255,0.22)", backdropFilter: "blur(4px)",
          color: "white", padding: "3px 8px", borderRadius: 999,
        }}>{recipe.category}</span>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16.5, fontWeight: 600, color: "var(--ink)", marginBottom: 8, lineHeight: 1.3 }}>
          {recipe.name}
        </h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
          <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>⏱ {formatTime(recipe.prepTime, recipe.cookTime)}</span>
          <StarRating rating={recipe.rating || 0} size="sm" />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {(recipe.tags || []).slice(0, 3).map(t => (
            <span key={t} style={{
              fontSize: 10.5, padding: "2px 8px", borderRadius: 999,
              background: "var(--surface)", color: "var(--ink-soft)",
              border: "1px solid var(--border)", fontWeight: 500,
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Filler shown when there aren't enough favorites to fill the loop.
export function PlaceholderFavoriteCard({ active, onAddNew, dragDelta }) {
  const [hovered, setHovered] = useState(false);
  const scale = active ? 1.02 : 0.96;
  const lift  = hovered ? -3 : 0;

  return (
    <div
      onClick={() => { if (Math.abs(dragDelta.current) > 5) return; onAddNew?.(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minWidth: CARD_W, width: CARD_W, minHeight: 226,
        borderRadius: "var(--r-lg)", background: "var(--surface)",
        border: "2px dashed var(--border)", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 10, padding: "28px 22px", textAlign: "center",
        boxShadow: active ? "var(--shadow-md)" : "none",
        transform: `scale(${scale}) translateY(${lift}px)`,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 26, color: "var(--ink-faint)" }}>♡</span>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)", lineHeight: 1.4 }}>
        Tap to choose<br />a favorite
      </p>
    </div>
  );
}
