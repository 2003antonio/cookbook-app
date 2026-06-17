import { useState, useRef } from "react";
import { StarRating } from "./components.jsx";
import { formatTime, formatIngredient } from "./useRecipes";

// ── Read-only Recipe Preview Sheet ───────────────────────────────────────────
function RecipePreviewSheet({ recipe, onClose, onAddToShopping }) {
  const [activeTab, setActiveTab] = useState("ingredients");
  const [servings, setServings] = useState(null);
  const [addedToast, setAddedToast] = useState(false);

  if (!recipe) return null;

  const currentServings = servings ?? recipe.baseServings ?? 4;
  const multiplier = currentServings / (recipe.baseServings || 1);

  const handleClose = () => { setServings(null); setActiveTab("ingredients"); onClose(); };

  const handleAddToShopping = () => {
    onAddToShopping(recipe);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const tabs = ["ingredients", "steps", ...(recipe.notes ? ["notes"] : [])];

  return (
    <>
      {/* Scrim */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(2px)", zIndex: 90,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Sheet */}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0,
        height: "88vh", background: "white",
        borderRadius: "24px 24px 0 0",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
        zIndex: 91, overflowY: "auto",
        animation: "slideUp 0.36s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {/* Drag handle */}
        <div style={{
          position: "sticky", top: 0, zIndex: 1, background: "white",
          padding: "10px 0 0", display: "flex", justifyContent: "center",
        }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--border)" }} />
        </div>

        {/* Hero */}
        <div style={{
          background: recipe.color,
          padding: "32px 24px 28px",
          position: "relative",
          flexShrink: 0,
        }}>
          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              position: "absolute", top: 16, right: 16,
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(255,255,255,0.22)", backdropFilter: "blur(4px)",
              color: "white", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.38)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
          >✕</button>

          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
            {recipe.category}
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "white", lineHeight: 1.15, marginBottom: 10, textShadow: "0 1px 6px rgba(0,0,0,0.18)" }}>
            {recipe.name}
          </h2>
          <StarRating rating={recipe.rating || 0} />
        </div>

        {/* Info row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--border)" }}>
          {[
            { label: "Prep", val: recipe.prepTime ? `${recipe.prepTime}m` : "—" },
            { label: "Cook", val: recipe.cookTime ? `${recipe.cookTime}m` : "—" },
            { label: "Total", val: formatTime(recipe.prepTime, recipe.cookTime) },
          ].map((p, i, arr) => (
            <div key={p.label} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "14px 8px", gap: 3,
              borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-faint)" }}>{p.label}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{p.val}</span>
            </div>
          ))}
        </div>

        {/* Servings scaler */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 20px", borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-faint)", flex: 1 }}>Servings</span>
          <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 999, overflow: "hidden", background: "white" }}>
            <button
              style={{ width: 32, height: 32, fontSize: 18, color: "var(--fire)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => setServings(Math.max(1, currentServings - 1))}
            >−</button>
            <span style={{ width: 32, textAlign: "center", fontSize: 14, fontWeight: 600 }}>{currentServings}</span>
            <button
              style={{ width: 32, height: 32, fontSize: 18, color: "var(--fire)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => setServings(currentServings + 1)}
            >+</button>
          </div>
          {multiplier !== 1 && (
            <button style={{ fontSize: 11, color: "var(--fire)", textDecoration: "underline" }} onClick={() => setServings(null)}>reset</button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px", gap: 4 }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "12px 14px", fontSize: 13.5, fontWeight: 500,
              color: activeTab === tab ? "var(--fire)" : "var(--ink-soft)",
              borderBottom: activeTab === tab ? "2px solid var(--fire)" : "2px solid transparent",
              marginBottom: -1, textTransform: "capitalize", transition: "color 0.15s",
            }}>{tab}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: 20 }}>
          {activeTab === "ingredients" && (
            <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(recipe.ingredients || []).map(ing => (
                <li key={ing.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--fire)", flexShrink: 0 }} />
                  {formatIngredient(ing, multiplier)}
                </li>
              ))}
            </ul>
          )}
          {activeTab === "steps" && (
            <ol style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(recipe.steps || []).map((step, i) => (
                <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "var(--fire-dim)", color: "var(--fire)",
                    fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>{i + 1}</span>
                  <p style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55, paddingTop: 2 }}>{step}</p>
                </li>
              ))}
            </ol>
          )}
          {activeTab === "notes" && (
            <div style={{
              background: "var(--fire-glow)", borderLeft: "3px solid var(--fire)",
              borderRadius: "0 var(--r-sm) var(--r-sm) 0",
              padding: "14px 16px", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink)",
            }}>{recipe.notes}</div>
          )}
        </div>

        {/* Footer — shopping only, no edit/delete */}
        <div style={{ padding: "14px 20px 32px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleAddToShopping}
            style={{
              width: "100%", padding: "11px", borderRadius: "var(--r-md)",
              background: addedToast ? "#22c55e" : "var(--fire)", color: "white",
              fontSize: 13.5, fontWeight: 600, transition: "background 0.3s",
            }}
          >
            {addedToast ? "✓ Added to shopping list!" : "🛒 Add ingredients to list"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </>
  );
}

// ── Swipeable Favorites Carousel ──────────────────────────────────────────────
function FavoritesCarousel({ favorites, onSelect }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef(null);
  const startX = useRef(null);
  const lastX = useRef(0);
  const velocity = useRef(0);
  const dragging = useRef(false);
  const dragDelta = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const count = favorites.length;
  if (!count) return null;

  const cardW = 280;
  const gap = 16;

  const clamp = (n) => Math.max(0, Math.min(count - 1, n));

  const goTo = (idx) => {
    setActive(clamp(idx));
    setDragOffset(0);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const onDown = (e) => {
    startX.current = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    lastX.current = startX.current;
    dragging.current = true;
    dragDelta.current = 0;
    velocity.current = 0;
  };

  const onMove = (e) => {
    if (!dragging.current) return;
    const x = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    velocity.current = x - lastX.current;
    lastX.current = x;
    dragDelta.current = x - startX.current;
    const maxOffset = cardW * 0.4;
    const bounded = Math.max(-maxOffset, Math.min(maxOffset, dragDelta.current));
    setDragOffset(bounded);
  };

  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const move = dragDelta.current;
    const v = velocity.current;
    const threshold = cardW * 0.25;
    let next = active;
    if (move < -threshold || v < -5) next = active + 1;
    else if (move > threshold || v > 5) next = active - 1;
    goTo(next);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>
          Your Favorites
        </h2>
        <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>{active + 1} / {count}</span>
      </div>

      <div style={{ overflow: "hidden", margin: "0 -24px", padding: "4px 0 16px" }}>
        <div
          ref={trackRef}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
          style={{
            display: "flex",
            gap,
            paddingLeft: 24,
            paddingRight: 24,
            transform: `translateX(calc(${-active * (cardW + gap)}px + ${dragOffset}px))`,
            transition:
              isAnimating || (!dragging.current && dragOffset === 0)
                ? "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)"
                : "none",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          {favorites.map((r, i) => (
            <FavoriteCard
              key={r.id}
              recipe={r}
              active={i === active}
              onSelect={onSelect}
              dragDelta={dragDelta}
            />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        {favorites.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === active ? 20 : 6,
              height: 6,
              borderRadius: 999,
              background: i === active ? "var(--fire)" : "var(--border)",
              transition: "all 0.25s ease",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FavoriteCard({ recipe, active, onSelect, dragDelta }) {
  return (
    <div
      onClick={() => {
        if (Math.abs(dragDelta.current) > 5) return;
        onSelect(recipe);
      }}
      style={{
        minWidth: 280,
        width: 280,
        borderRadius: "var(--r-lg)",
        background: recipe.color,
        cursor: "pointer",
        boxShadow: active ? "var(--shadow-lg)" : "var(--shadow-sm)",
        transform: active ? "scale(1.02)" : "scale(0.96)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div style={{ padding: "28px 22px 22px" }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 8,
        }}>
          {recipe.category}
        </div>
        <h3 style={{
          fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700,
          color: "white", lineHeight: 1.1, marginBottom: 12,
          textShadow: "0 1px 6px rgba(0,0,0,0.2)",
        }}>
          {recipe.name}
        </h3>
        <StarRating rating={recipe.rating || 0} size="sm" />
      </div>

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
            }}>
              {t}
            </span>
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
      <div style={{
        width: 48, height: 48, borderRadius: "var(--r-sm)",
        background: recipe.color, flexShrink: 0,
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
export default function HomeScreen({ recipes, onGoToRecipes, onNewRecipe, onAddToShopping }) {
  const [previewRecipe, setPreviewRecipe] = useState(null);

  const favorites = recipes.filter(r => r.favorite);
  const recent = recipes.slice(0, 6);
  const totalTime = recipes.reduce((s, r) => s + (r.prepTime || 0) + (r.cookTime || 0), 0);

  const stats = [
    { label: "Recipes", val: recipes.length, filter: "All" },
    { label: "Favorites", val: favorites.length, filter: "Favorites" },
    { label: "Avg time", val: recipes.length ? `${Math.round(totalTime / recipes.length)}m` : "—", filter: null },
  ];

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
          {stats.map(s => {
            const clickable = s.filter !== null;
            return (
              <button
                key={s.label}
                onClick={() => clickable && onGoToRecipes(s.filter)}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.07)",
                  borderRadius: "var(--r-md)",
                  padding: "12px 14px",
                  backdropFilter: "blur(8px)",
                  textAlign: "left",
                  border: "none",
                  cursor: clickable ? "pointer" : "default",
                  transition: clickable ? "background 0.15s" : "none",
                }}
                onMouseEnter={e => { if (clickable) e.currentTarget.style.background = "rgba(255,255,255,0.13)"; }}
                onMouseLeave={e => { if (clickable) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              >
                <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "white", lineHeight: 1 }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 3, fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
                  {s.label}
                  {clickable && <span style={{ fontSize: 9, opacity: 0.6 }}>›</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Favorites carousel — card tap opens preview sheet */}
        {favorites.length > 0 ? (
          <FavoritesCarousel favorites={favorites} onSelect={setPreviewRecipe} />
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
              {recent.map(r => <RecentRow key={r.id} recipe={r} onSelect={() => onGoToRecipes("All")} />)}
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

      {/* Read-only preview sheet */}
      {previewRecipe && (
        <RecipePreviewSheet
          recipe={previewRecipe}
          onClose={() => setPreviewRecipe(null)}
          onAddToShopping={onAddToShopping}
        />
      )}
    </div>
  );
}