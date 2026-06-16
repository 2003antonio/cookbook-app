import { useState, useRef } from "react";
import { StarRating } from "./components.jsx";
import { formatTime } from "./useRecipes";

// ── Swipeable Favorites Carousel ──────────────────────────────────────────────
function FavoritesCarousel({ favorites, onSelect }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef(null);
  const startX = useRef(null);
  const dragging = useRef(false);
  const dragDelta = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const count = favorites.length;
  if (!count) return null;

  const clamp = (n) => Math.max(0, Math.min(count - 1, n));

  const goTo = (idx) => {
    setActive(clamp(idx));
    setDragOffset(0);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Touch / mouse handlers
  const onDown = (e) => {
    startX.current = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    dragging.current = true;
    dragDelta.current = 0;
  };

  const onMove = (e) => {
    if (!dragging.current) return;
    const x = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    dragDelta.current = x - startX.current;
    setDragOffset(dragDelta.current);
  };

  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const threshold = 60;
    if (dragDelta.current < -threshold) goTo(active + 1);
    else if (dragDelta.current > threshold) goTo(active - 1);
    else setDragOffset(0);
  };

  const cardW = 280;
  const gap = 16;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>
          Your Favorites
        </h2>
        <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>{active + 1} / {count}</span>
      </div>

      {/* Track */}
      <div style={{ overflow: "hidden", margin: "0 -24px", padding: "4px 0 16px" }}>
        <div
          ref={trackRef}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          style={{
            display: "flex",
            gap,
            paddingLeft: 24,
            paddingRight: 24,
            transform: `translateX(calc(${-active * (cardW + gap)}px + ${dragOffset}px))`,
            transition: ((isAnimating || dragOffset) === (0 && !dragging.current)) ? "transform 0.32s cubic-bezier(0.4,0,0.2,1)" : "none",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          {favorites.map((r, i) => (
            <FavoriteCard key={r.id} recipe={r} active={i === active} onSelect={onSelect} />
          ))}
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        {favorites.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: i === active ? 20 : 6, height: 6, borderRadius: 999,
            background: i === active ? "var(--fire)" : "var(--border)",
            transition: "all 0.25s ease", padding: 0,
          }} />
        ))}
      </div>
    </div>
  );
}

function FavoriteCard({ recipe, active, onSelect }) {
  return (
    <div
      onClick={() => onSelect(recipe)}
      style={{
        minWidth: 280, width: 280, borderRadius: "var(--r-lg)",
        background: recipe.color, cursor: "pointer",
        boxShadow: active ? "var(--shadow-lg)" : "var(--shadow-sm)",
        transform: active ? "scale(1.02)" : "scale(0.96)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        overflow: "hidden", flexShrink: 0,
      }}
    >
      {/* Color block with content */}
      <div style={{ padding: "28px 22px 22px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
          {recipe.category}
        </div>
        <h3 style={{
          fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700,
          color: "white", lineHeight: 1.1, marginBottom: 12,
          textShadow: "0 1px 6px rgba(0,0,0,0.2)",
        }}>{recipe.name}</h3>
        <StarRating rating={recipe.rating || 0} size="sm" />
      </div>

      {/* Footer strip */}
      <div style={{
        background: "rgba(0,0,0,0.18)", padding: "12px 22px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
          ⏱ {formatTime(recipe.prepTime, recipe.cookTime)}
        </span>
        <div style={{ display: "flex", gap: 5 }}>
          {(recipe.tags || []).slice(0, 2).map(t => (
            <span key={t} style={{
              fontSize: 10.5, padding: "2px 8px", borderRadius: 999,
              background: "rgba(255,255,255,0.2)", color: "white", fontWeight: 500,
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Recent Recipe Row ─────────────────────────────────────────────────────────
function RecentRow({ recipe, onSelect }) {
  return (
    <button onClick={() => onSelect(recipe)} style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 0", borderBottom: "1px solid var(--border)",
      width: "100%", textAlign: "left", transition: "opacity 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      {/* Color swatch */}
      <div style={{
        width: 48, height: 48, borderRadius: "var(--r-sm)",
        background: recipe.color, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20,
      }} />
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

// ── Home Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen({ recipes, onSelectRecipe, onNewRecipe }) {
  const favorites = recipes.filter(r => r.favorite);
  const recent = recipes.slice(0, 6);
  const totalTime = recipes.reduce((s, r) => s + (r.prepTime || 0) + (r.cookTime || 0), 0);

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: "calc(var(--nav-h) + 16px)" }}>
      {/* Header */}
      <div style={{
        padding: "32px 24px 24px",
        background: "linear-gradient(160deg, var(--ink) 0%, #2d2d30 100%)",
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fire)", marginBottom: 6 }}>
          Touch of Zade
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, color: "white", lineHeight: 1.1, marginBottom: 6 }}>
          Your kitchen,<br />organized.
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
          {recipes.length} recipes · {favorites.length} favorites
        </p>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "Recipes", val: recipes.length },
            { label: "Favorites", val: favorites.length },
            { label: "Avg time", val: recipes.length ? `${Math.round(totalTime / recipes.length)}m` : "—" },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: "rgba(255,255,255,0.07)", borderRadius: "var(--r-md)",
              padding: "12px 14px", backdropFilter: "blur(8px)",
            }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "white", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 3, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Favorites carousel */}
        {favorites.length > 0 ? (
          <FavoritesCarousel favorites={favorites} onSelect={onSelectRecipe} />
        ) : (
          <div style={{
            background: "var(--surface)", borderRadius: "var(--r-lg)",
            padding: "28px 24px", textAlign: "center", border: "2px dashed var(--border)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>♡</div>
            <p style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)", marginBottom: 4 }}>No favorites yet</p>
            <p style={{ fontSize: 13, color: "var(--ink-faint)" }}>Open a recipe and tap ♡ to add it here</p>
          </div>
        )}

        {/* Recent recipes */}
        {recent.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>
                Recent
              </h2>
            </div>
            <div>
              {recent.map(r => <RecentRow key={r.id} recipe={r} onSelect={onSelectRecipe} />)}
            </div>
          </div>
        )}

        {/* Empty state CTA */}
        {recipes.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 20 }}>
            <p style={{ fontSize: 15, color: "var(--ink-soft)", marginBottom: 16 }}>Start building your cookbook</p>
            <button onClick={onNewRecipe} style={{
              padding: "12px 28px", background: "var(--fire)", color: "white",
              borderRadius: "var(--r-full)", fontSize: 15, fontWeight: 600,
              boxShadow: "var(--shadow-md)",
            }}>+ Add your first recipe</button>
          </div>
        )}
      </div>
    </div>
  );
}
