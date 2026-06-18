import { useState, useEffect, useRef } from "react";
import { StarRating, RecipeDetail } from "./components.jsx";
import { CATEGORY_OPTIONS, formatTime } from "./useRecipes";

// ── Recipe Card ───────────────────────────────────────────────────────────────
function RecipeCard({ recipe, onSelect, active, onToggleFavorite }) {
  return (
    <div
      onClick={() => onSelect(recipe)}
      style={{
        background: "white", borderRadius: "var(--r-lg)",
        boxShadow: active ? "0 0 0 2.5px var(--fire), var(--shadow-md)" : "var(--shadow-card)",
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
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(recipe.id);
            }}
            style={{
              position: "absolute", top: 10, right: 10,
              fontSize: 16, background: "none", border: "none",
              cursor: "pointer", color: "red",
            }}
          >
            ♥
          </button>
        )}
        <span style={{
          fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
          background: "rgba(255,255,255,0.22)", backdropFilter: "blur(4px)",
          color: "white", padding: "3px 8px", borderRadius: 999,
        }}>{recipe.category}</span>
      </div>

      <div style={{ padding: "12px 14px 14px" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15.5, fontWeight: 600, color: "var(--ink)", marginBottom: 7, lineHeight: 1.3 }}>
          {recipe.name}
        </h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>⏱ {formatTime(recipe.prepTime, recipe.cookTime)}</span>
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

// ── Slide-up Detail Sheet ─────────────────────────────────────────────────────
function DetailSheet({ recipe, onClose, onEdit, onDelete, onToggleFavorite, onAddToShopping }) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);

  // Touch Start: Record where the finger first touched
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  //Touch Move: Calculate how far down the user pulled
  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;

    //Only allow dragging downwards (positive numbers)
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  //Touch End: Decide to close or snap back up
  const handleTouchEnd = () => {
    setIsDragging(false);

    // If pulled down more than 250px, close it. Otherwise, reset.
    if (dragY > 250) {
      onClose();
    }
    setDragY(0);
  };

  return (
    <>
      {recipe && (
        <div onClick={onClose} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(2px)", zIndex: 90,
          animation: "fadeIn 0.2s ease",
        }} />
      )}

      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0,
        height: "88vh", background: "white",
        borderRadius: "24px 24px 0 0",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
        zIndex: 91, overflow: "hidden",
        flexDirection: "column",
        // Dynamically add the drag distance to the translation
        transform: recipe ? `translateY(${dragY}px)` : "translateY(100%)",
        // Disable transition animations only while the user is actively dragging
        transition: isDragging ? "none" : "transform 0.36s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>

        {/* Attaching the touch event listeners directly to the drag handle area */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: "sticky", top: 0, zIndex: 1, background: "white",
            padding: "10px 0 5px", display: "flex", justifyContent: "center",
            cursor: "grab", // Changes cursor to hand icon on desktop browsers
            touchAction: "none" // Prevents default browser refreshing/scrolling behavior
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--border)" }} />
        </div>

        {recipe && (
          <RecipeDetail
            recipe={recipe}
            onClose={onClose}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            onAddToShopping={onAddToShopping}
          />
        )}
      </div>
    </>
  );
}

// ── Recipes Screen ────────────────────────────────────────────────────────────
export default function RecipesScreen({
  recipes, onSelectRecipe, selectedRecipe, onCloseDetail,
  onEdit, onDelete, onToggleFavorite, onAddToShopping, onNewRecipe,
  initialFilter = "All",
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(initialFilter);

  // Sync when navigating here from Home with a specific filter
  useEffect(() => {
    setActiveCategory(initialFilter);
  }, [initialFilter]);

  const favoritesCount = recipes.filter(r => r.favorite).length;

  const filtered = recipes.filter(r => {
    const matchCat =
      activeCategory === "All" ? true :
        activeCategory === "Favorites" ? r.favorite :
          r.category === activeCategory;
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const counts = recipes.reduce((a, r) => { a[r.category] = (a[r.category] || 0) + 1; return a; }, {});

  return (
    <>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "24px 24px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, lineHeight: 1.1 }}>Recipes</h1>
              <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={onNewRecipe} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "9px 16px", background: "var(--fire)", color: "white",
              borderRadius: "var(--r-full)", fontSize: 13.5, fontWeight: 600,
              boxShadow: "var(--shadow-sm)",
            }}>+ New</button>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none" }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes, tags…"
              style={{
                width: "100%", padding: "10px 14px 10px 36px",
                border: "1.5px solid var(--border)", borderRadius: "var(--r-full)",
                fontSize: 14, background: "var(--surface)", outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = "var(--fire)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          {/* Category pills — All, Favorites, then categories */}
          <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 14, WebkitOverflowScrolling: "touch" }}>
            {/* All */}
            {["All"].map(cat => {
              const isActive = activeCategory === cat;
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                  whiteSpace: "nowrap", padding: "6px 14px",
                  borderRadius: 999, fontSize: 13, fontWeight: 500,
                  background: isActive ? "var(--fire)" : "var(--surface)",
                  color: isActive ? "white" : "var(--ink-soft)",
                  border: isActive ? "none" : "1.5px solid var(--border)",
                  transition: "all 0.15s", flexShrink: 0,
                }}>
                  {cat} <span style={{ opacity: 0.7, fontSize: 11 }}>({recipes.length})</span>
                </button>
              );
            })}

            {/* Favorites pill — only shown if there are any */}
            {favoritesCount > 0 && (
              <button onClick={() => setActiveCategory("Favorites")} style={{
                whiteSpace: "nowrap", padding: "6px 14px",
                borderRadius: 999, fontSize: 13, fontWeight: 500,
                background: activeCategory === "Favorites" ? "var(--fire)" : "var(--surface)",
                color: activeCategory === "Favorites" ? "white" : "var(--ink-soft)",
                border: activeCategory === "Favorites" ? "none" : "1.5px solid var(--border)",
                transition: "all 0.15s", flexShrink: 0,
              }}>
                ♥ Favorites <span style={{ opacity: 0.7, fontSize: 11 }}>({favoritesCount})</span>
              </button>
            )}

            {/* Per-category pills */}
            {CATEGORY_OPTIONS.map(c => {
              const count = counts[c.name] || 0;
              if (!count) return null;
              const isActive = activeCategory === c.name;
              return (
                <button key={c.name} onClick={() => setActiveCategory(c.name)} style={{
                  whiteSpace: "nowrap", padding: "6px 14px",
                  borderRadius: 999, fontSize: 13, fontWeight: 500,
                  background: isActive ? "var(--fire)" : "var(--surface)",
                  color: isActive ? "white" : "var(--ink-soft)",
                  border: isActive ? "none" : "1.5px solid var(--border)",
                  transition: "all 0.15s", flexShrink: 0,
                }}>
                  {c.name} <span style={{ opacity: 0.7, fontSize: 11 }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px", paddingBottom: "calc(var(--nav-h) + 16px)" }}>
          {filtered.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 14,
            }}>
              {filtered.map(r => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  onSelect={onSelectRecipe}
                  active={selectedRecipe?.id === r.id}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 10, color: "var(--ink-faint)" }}>
              <span style={{ fontSize: 40 }}>🍽️</span>
              <p style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-soft)" }}>
                {search ? "No recipes match your search" : "No recipes yet"}
              </p>
              {!search && (
                <button onClick={onNewRecipe} style={{
                  marginTop: 8, padding: "10px 24px",
                  background: "var(--fire)", color: "white",
                  borderRadius: "var(--r-full)", fontSize: 14, fontWeight: 600,
                }}>+ Add your first recipe</button>
              )}
            </div>
          )}
        </div>
      </div>

      <DetailSheet
        recipe={selectedRecipe}
        onClose={onCloseDetail}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleFavorite={onToggleFavorite}
        onAddToShopping={onAddToShopping}
      />

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </>
  );
}
