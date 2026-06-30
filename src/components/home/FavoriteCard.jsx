import { useState, memo } from "react";
import { StarRating } from "../ui/StarRating";
import { formatTime, hexToRgba } from "../../models/recipe";

export const CARD_W    = 280;
// GAP matches the carousel track's paddingLeft (24) so the card that rotates
// off the left edge sits completely off-screen instead of leaving a sliver.
export const GAP       = 24;
export const CARD_STEP = CARD_W + GAP;

// A pre-painted shadow on its own layer, behind the card body. Elevation is
// animated by crossfading this layer's OPACITY (compositor-only) instead of
// transitioning `box-shadow` on the card itself — the latter forces a
// main-thread repaint of the blur every single frame, which is what made the
// carousel stutter while cards settled mid-drag. The blur is rasterized once;
// after that, growing/shrinking the elevation is just an alpha multiply the GPU
// already does for free. Kept as a CSS var so dark mode's heavier shadow still
// applies. `instant` skips the fade during the loop's silent recenter jump.
function ShadowLayer({ shadow, active, instant, baseOpacity = 0 }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute", inset: 0, zIndex: 0,
        borderRadius: "var(--r-lg)",
        boxShadow: shadow,
        opacity: active ? 1 : baseOpacity,
        transition: instant ? "none" : "opacity 0.4s cubic-bezier(0.25, 1, 0.35, 1)",
        pointerEvents: "none",
      }}
    />
  );
}

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
        position: "relative",
        minWidth: CARD_W, width: CARD_W, flexShrink: 0,
        cursor: "pointer",
        transform: `scale(${scale}) translateY(${lift}px)`,
        // Only transform animates on the card now; the elevation lives on the
        // shadow layer's opacity, so nothing here repaints per frame.
        transition: instant ? "none" : "transform 0.18s ease",
      }}
    >
      <ShadowLayer shadow="var(--shadow-md)" active={active} instant={instant} baseOpacity={0.35} />

      <div style={{
        position: "relative", zIndex: 1,
        background: "var(--card-bg)", borderRadius: "var(--r-lg)",
        border: "1px solid var(--border)", overflow: "hidden",
      }}>
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
        position: "relative",
        minWidth: CARD_W, width: CARD_W, flexShrink: 0,
        cursor: "pointer",
        transform: `scale(${scale}) translateY(${lift}px)`,
        transition: instant ? "none" : "transform 0.18s ease",
      }}
    >
      {/* Inactive placeholders carry no shadow (baseOpacity 0), so side cards
          stay flat and cost nothing extra to rasterize while the track moves. */}
      <ShadowLayer shadow="var(--shadow-md)" active={active} instant={instant} baseOpacity={0} />

      <div style={{
        position: "relative", zIndex: 1,
        minHeight: 226,
        borderRadius: "var(--r-lg)", background: "var(--surface)",
        border: "2px dashed var(--border)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 10, padding: "28px 22px", textAlign: "center",
      }}>
        <span style={{ fontSize: 26, color: "var(--ink-faint)" }}>♡</span>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)", lineHeight: 1.4 }}>
          Tap to choose<br />a favorite
        </p>
      </div>
    </div>
  );
});
