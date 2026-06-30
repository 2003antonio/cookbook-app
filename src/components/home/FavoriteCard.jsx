import { useState, memo } from "react";
import { StarRating } from "../ui/StarRating";
import { formatTime, hexToRgba } from "../../models/recipe";

export const CARD_W    = 280;
// GAP matches the carousel track's paddingLeft (24) so the card that rotates
// off the left edge sits completely off-screen instead of leaving a sliver.
export const GAP       = 24;
export const CARD_STEP = CARD_W + GAP;

// Read-only card shown in the Favorites carousel. Memoized so the carousel's
// per-pointer-move drag re-renders don't reconcile every card in the loop — a
// card only re-renders when its own props (active/instant/recipe) change.
export const FavoriteCard = memo(function FavoriteCard({ recipe, active, onSelect, dragDelta, instant = false }) {
  const [hovered, setHovered] = useState(false);
  const scale = active ? 1.02 : 0.96;
  const lift  = hovered ? -3 : 0;

  const hasImage   = !!recipe.image;
  const tint       = hexToRgba(recipe.color, 0.12);
  const tintBorder = hexToRgba(recipe.color, 0.45);
  const tags       = (recipe.tags || []).slice(0, 3);

  return (
    <div
      onClick={() => { if (Math.abs(dragDelta.current) > 5) return; onSelect(recipe); }}
      onMouseMove={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minWidth: CARD_W, width: CARD_W,
        background: "var(--card-bg)", borderRadius: "var(--r-lg)",
        border: "1px solid var(--border)",
        cursor: "pointer", overflow: "hidden",
        boxShadow: active ? "var(--shadow-lg)" : "var(--shadow-sm)",
        transform: `scale(${scale}) translateY(${lift}px)`,
        // Shadow eases on the same curve/duration as the carousel slide so the
        // elevation grows in lockstep with the card moving into the center.
        // `instant` skips the animation during the loop's silent recenter jump.
        transition: instant ? "none" : "transform 0.18s ease, box-shadow 0.4s cubic-bezier(0.25, 1, 0.35, 1)",
        flexShrink: 0,
      }}
    >
      <div style={{ height: 110, background: recipe.color, position: "relative", display: "flex", alignItems: "flex-end", padding: 12 }}>
        {hasImage && (
          <>
            <img src={recipe.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent 55%)" }} />
          </>
        )}
        <span style={{
          position: "relative", zIndex: 1,
          fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
          // No backdrop-filter here: blur forces a per-frame repaint of every
          // visible card (instead of a compositor-only transform), which is
          // what was capping carousel drag at ~30fps. Plain translucent bg
          // looks nearly identical and stays on the GPU compositor fast path.
          background: "rgba(0,0,0,0.32)",
          color: "white", padding: "3px 8px", borderRadius: 999,
        }}>{recipe.category}</span>
      </div>

      {/* Name */}
      <div style={{ padding: "13px 16px 9px" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16.5, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}>
          {recipe.name}
        </h3>
      </div>

      {/* Details — tinted with the card color, a clear color change from the name */}
      <div style={{ padding: "11px 16px 15px", background: tint, borderTop: `1px solid ${tintBorder}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: tags.length ? 9 : 0 }}>
          <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>⏱ {formatTime(recipe.prepTime, recipe.cookTime)}</span>
          <StarRating rating={recipe.rating || 0} size="sm" />
        </div>
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {tags.map(t => (
              <span key={t} style={{
                fontSize: 10.5, padding: "2px 8px", borderRadius: 999,
                background: "var(--card-bg)", color: "var(--ink-soft)",
                border: "1px solid var(--border)", fontWeight: 500,
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// Filler shown when there aren't enough favorites to fill the loop.
export const PlaceholderFavoriteCard = memo(function PlaceholderFavoriteCard({ active, onAddNew, dragDelta, instant = false }) {
  const [hovered, setHovered] = useState(false);
  const scale = active ? 1.02 : 0.96;
  const lift  = hovered ? -3 : 0;

  return (
    <div
      onClick={() => { if (Math.abs(dragDelta.current) > 5) return; onAddNew?.(); }}
      onMouseMove={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minWidth: CARD_W, width: CARD_W, minHeight: 226,
        borderRadius: "var(--r-lg)", background: "var(--surface)",
        border: "2px dashed var(--border)", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 10, padding: "28px 22px", textAlign: "center",
        boxShadow: active ? "var(--shadow-md)" : "none",
        transform: `scale(${scale}) translateY(${lift}px)`,
        transition: instant ? "none" : "transform 0.18s ease, box-shadow 0.4s cubic-bezier(0.25, 1, 0.35, 1)",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 26, color: "var(--ink-faint)" }}>♡</span>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)", lineHeight: 1.4 }}>
        Tap to choose<br />a favorite
      </p>
    </div>
  );
});
