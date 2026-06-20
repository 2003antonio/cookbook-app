import { useState, useRef, useEffect } from "react";
import { StarRating } from "./components.jsx";
import { formatTime, formatIngredient } from "./useRecipes";

function RecipePreviewSheet({ recipe, onClose, onAddToShopping }) {
  const [activeTab, setActiveTab] = useState("ingredients");
  const [servings, setServings] = useState(null);
  const [addedToast, setAddedToast] = useState(false);

  if (!recipe) return null;

  const currentServings = servings ?? recipe.baseServings ?? 4;
  const multiplier = currentServings / (recipe.baseServings || 1);

  const handleClose = () => {
    setServings(null);
    setActiveTab("ingredients");
    onClose();
  };

  const handleAddToShopping = () => {
    onAddToShopping(recipe);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const tabs = ["ingredients", "steps", ...(recipe.notes ? ["notes"] : [])];

  const noteLines = recipe.notes
    ? recipe.notes.split("\n").map(l => l.trim()).filter(Boolean)
    : [];

  return (
    <>
      {/* Scrim */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(2px)",
          zIndex: 90,
        }}
      />

      {/* Sheet */}
      <div style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: "88vh",
        background: "white",
        borderRadius: "24px 24px 0 0",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
        zIndex: 91,
        display: "flex",
        flexDirection: "column",
      }}>

        {/* Hero */}
        <div style={{
          background: recipe.color,
          padding: "48px 24px 28px",
          position: "relative",
          flexShrink: 0,
        }}>
          <button
            onClick={handleClose}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.22)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >✕</button>

          <div style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.75)",
            marginBottom: 6
          }}>
            {recipe.category}
          </div>

          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 700,
            color: "white",
            lineHeight: 1.15,
            marginBottom: 10,
          }}>
            {recipe.name}
          </h2>

          <StarRating rating={recipe.rating || 0} />
        </div>

        {/* Info row (MATCHES DETAIL) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          borderBottom: "1px solid var(--border)"
        }}>
          {[
            { label: "Prep", val: recipe.prepTime ? `${recipe.prepTime}m` : "—" },
            { label: "Cook", val: recipe.cookTime ? `${recipe.cookTime}m` : "—" },
            { label: "Total", val: formatTime(recipe.prepTime, recipe.cookTime) },
            {
              label: "Servings",
              customRender: () => (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1.5px solid var(--border)",
                    borderRadius: 999,
                    overflow: "hidden",
                    background: "white"
                  }}>
                    <button
                      onClick={() => setServings(Math.max(1, currentServings - 1))}
                      style={{ width: 32, height: 32 }}
                    >−</button>

                    <span style={{ width: 32, textAlign: "center" }}>
                      {currentServings}
                    </span>

                    <button
                      onClick={() => setServings(currentServings + 1)}
                      style={{ width: 32, height: 32 }}
                    >+</button>
                  </div>

                  {multiplier !== 1 && (
                    <button
                      onClick={() => setServings(null)}
                      style={{
                        fontSize: 12,
                        color: "var(--fire)",
                        textDecoration: "underline",
                        position: "absolute",
                        bottom: -18,
                      }}
                    >
                      reset
                    </button>
                  )}
                </div>
              )
            }
          ].map((p, i, arr) => (
            <div key={p.label} style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "14px 8px 20px",
              borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
              background: p.label === "Servings" ? "var(--surface)" : "none",
            }}>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                color: "var(--ink-faint)"
              }}>
                {p.label}
              </span>

              {p.customRender
                ? p.customRender()
                : <span style={{ fontWeight: 600 }}>{p.val}</span>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          padding: "0 20px",
          gap: 12
        }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "12px",
                color: activeTab === tab ? "var(--fire)" : "var(--ink-soft)",
                borderBottom: activeTab === tab ? "2px solid var(--fire)" : "none",
                textTransform: "capitalize",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>

          {/* INGREDIENTS (NO CHECKLIST) */}
          {activeTab === "ingredients" && (
            <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(recipe.ingredients || []).map(ing => (
                <li key={ing.id} style={{
                  display: "flex",
                  gap: 10,
                  fontSize: 13.5,
                  color: "var(--ink)"
                }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--fire)",
                    marginTop: 6,
                  }} />
                  {formatIngredient(ing, multiplier)}
                </li>
              ))}
            </ul>
          )}

          {activeTab === "steps" && (
            <ol style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(recipe.steps || []).map((step, i) => (
                <li key={i} style={{ display: "flex", gap: 12 }}>
                  <span style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--fire-dim)",
                    color: "var(--fire)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}>
                    {i + 1}
                  </span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          )}

          {activeTab === "notes" && (
            <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {noteLines.map((line, i) => (
                <li key={i} style={{ display: "flex", gap: 10 }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--fire)",
                    marginTop: 6,
                  }} />
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px 32px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleAddToShopping}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "var(--r-md)",
              background: addedToast ? "#22c55e" : "var(--fire)",
              color: "white",
              fontWeight: 600,
            }}
          >
            {addedToast ? "✓ Added to shopping list!" : "🛒 Add ingredients to list"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Swipeable, Infinitely-Looping Favorites Carousel ──────────────────────────
const CARD_W = 280;
const GAP = 16;
const CARD_STEP = CARD_W + GAP;

function FavoritesCarousel({ favorites, onSelect, onAddNew }) {
  const outerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure available width so we know how many cards are visible on this device
  useEffect(() => {
    const measure = () => setContainerWidth(outerRef.current?.offsetWidth || window.innerWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Build the base slide list: real favorites, padded with "add new" placeholders
  // so the row is long enough to loop smoothly on this screen size.
  const visibleCount = containerWidth ? Math.max(1, Math.ceil(containerWidth / CARD_STEP)) : 2;
  const minSlides = Math.max(visibleCount * 2, 3);
  const placeholderCount = Math.max(0, minSlides - favorites.length);

  const baseSlides = [
    ...favorites.map(r => ({ type: "recipe", id: String(r.id), recipe: r })),
    ...Array.from({ length: placeholderCount }, (_, i) => ({ type: "placeholder", id: `placeholder-${i}` })),
  ];
  const n = baseSlides.length;

  // Triple the list so we always have a full "screen" of cards to scroll toward
  // in either direction — the illusion of an endless, continuously rotating loop.
  const loopSlides = [...baseSlides, ...baseSlides, ...baseSlides];

  const [active, setActive] = useState(n); // start in the middle copy
  const [transitioning, setTransitioning] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const startX = useRef(null);
  const lastX = useRef(0);
  const velocity = useRef(0);
  const dragging = useRef(false);
  const dragDelta = useRef(0);

  // Re-center whenever the slide count changes (e.g. a favorite is added/removed)
  useEffect(() => { setTransitioning(false); setActive(n); }, [n]);

  if (!favorites.length) return null;

  const goTo = (idx) => {
    setDragOffset(0);
    setTransitioning(true);
    setActive(idx);
  };

  // Once a swipe/snap animation finishes, silently re-center into the middle
  // copy of the loop (no transition) so we never run out of cards to scroll to.
  // Guard against bubbled transitionend events from child cards (their own
  // hover/active transform & box-shadow transitions) — only react to the
  // track's own transform finishing.
  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    setTransitioning(false);
    if (active >= n * 2) setActive(active - n);
    else if (active < n) setActive(active + n);
  };

  const onDown = (e) => {
    startX.current = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    lastX.current = startX.current;
    dragging.current = true;
    dragDelta.current = 0;
    velocity.current = 0;
    setTransitioning(false);
  };

  const onMove = (e) => {
    if (!dragging.current) return;
    const x = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    velocity.current = x - lastX.current;
    lastX.current = x;
    dragDelta.current = x - startX.current;
    const maxOffset = CARD_W * 0.4;
    setDragOffset(Math.max(-maxOffset, Math.min(maxOffset, dragDelta.current)));
  };

  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const move = dragDelta.current;
    const v = velocity.current;
    const threshold = CARD_W * 0.25;
    let next = active;
    if (move < -threshold || v < -5) next = active + 1;
    else if (move > threshold || v > 5) next = active - 1;
    goTo(next);
  };

  const activeDot = ((active % n) + n) % n;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>
          Your Favorites
        </h2>
        <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>{activeDot + 1} / {n}</span>
      </div>

      <div ref={outerRef} style={{ overflow: "hidden", margin: "0 -24px", padding: "4px 0 16px" }}>
        <div
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
          onTransitionEnd={handleTransitionEnd}
          style={{
            display: "flex",
            gap: GAP,
            paddingLeft: 24,
            paddingRight: 24,
            transform: `translateX(calc(${-active * CARD_STEP}px + ${dragOffset}px))`,
            transition: transitioning ? "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          {loopSlides.map((slide, i) => {
            const isActive = i === active;
            return slide.type === "recipe" ? (
              <FavoriteCard
                key={`${Math.floor(i / n)}-${slide.id}`}
                recipe={slide.recipe}
                active={isActive}
                onSelect={onSelect}
                dragDelta={dragDelta}
              />
            ) : (
              <PlaceholderFavoriteCard
                key={`${Math.floor(i / n)}-${slide.id}`}
                active={isActive}
                onAddNew={onAddNew}
                dragDelta={dragDelta}
              />
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        {baseSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(active + (i - activeDot))}
            style={{
              width: i === activeDot ? 20 : 6,
              height: 6,
              borderRadius: 999,
              background: i === activeDot ? "var(--fire)" : "var(--border)",
              transition: "all 0.25s ease",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Read-only preview card — same look as the Recipes grid card, minus the
// favorite/edit/delete controls, since this is just a tap-to-view shortcut.
function FavoriteCard({ recipe, active, onSelect, dragDelta }) {
  return (
    <div
      onClick={() => {
        if (Math.abs(dragDelta.current) > 5) return;
        onSelect(recipe);
      }}
      style={{
        minWidth: CARD_W, width: CARD_W,
        background: "white", borderRadius: "var(--r-lg)",
        cursor: "pointer", overflow: "hidden",
        boxShadow: active ? "var(--shadow-lg)" : "var(--shadow-sm)",
        transform: active ? "scale(1.02)" : "scale(0.96)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        flexShrink: 0,
      }}
    >
      {/* Color swatch */}
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

// Filler card shown when there aren't enough favorites to fill the loop —
// keeps the carousel feeling continuous instead of stopping short.
function PlaceholderFavoriteCard({ active, onAddNew, dragDelta }) {
  return (
    <div
      onClick={() => {
        if (Math.abs(dragDelta.current) > 5) return;
        onAddNew?.();
      }}
      style={{
        minWidth: CARD_W, width: CARD_W, minHeight: 226,
        borderRadius: "var(--r-lg)",
        background: "var(--surface)",
        border: "2px dashed var(--border)",
        cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 10, padding: "28px 22px", textAlign: "center",
        boxShadow: active ? "var(--shadow-md)" : "none",
        transform: active ? "scale(1.02)" : "scale(0.96)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 26, color: "var(--ink-faint)" }}>♡</span>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)", lineHeight: 1.4 }}>
        Click to add<br />new favorite
      </p>
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
          <FavoritesCarousel favorites={favorites} onSelect={setPreviewRecipe} onAddNew={onNewRecipe} />
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