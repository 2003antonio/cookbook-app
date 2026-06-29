import { useState, useEffect } from "react";
import { RecipeCard, DetailSheet } from "../components/recipe";
import { CATEGORY_OPTIONS }        from "../models/recipe";

export default function RecipesScreen({
  recipes, onSelectRecipe, selectedRecipe, onCloseDetail,
  onEdit, onDelete, onToggleFavorite, onAddToShopping, onNewRecipe,
  onNavigateRecipe,
  initialFilter = "All",
}) {
  const [search,         setSearch]         = useState("");
  const [activeCategory, setActiveCategory] = useState(initialFilter);

  // Sync when navigating here from Home with a specific filter
  useEffect(() => { setActiveCategory(initialFilter); }, [initialFilter]);

  const favoritesCount = recipes.filter(r => r.favorite).length;

  const filtered = recipes.filter(r => {
    const matchCat =
      activeCategory === "All"       ? true :
      activeCategory === "Favorites" ? r.favorite :
      r.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = r.name.toLowerCase().includes(q) || (r.tags || []).some(t => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const counts = recipes.reduce((acc, r) => { acc[r.category] = (acc[r.category] || 0) + 1; return acc; }, {});

  // ── Pill button style ────────────────────────────────────────────────────────
  const pillStyle = isActive => ({
    whiteSpace: "nowrap", padding: "6px 14px",
    borderRadius: 999, fontSize: 13, fontWeight: 500,
    background: isActive ? "var(--fire)" : "rgba(255,255,255,0.1)",
    color:      isActive ? "white"       : "rgba(255,255,255,0.7)",
    border:     isActive ? "none"        : "1.5px solid rgba(255,255,255,0.15)",
    transition: "all 0.15s", flexShrink: 0,
  });

  return (
    <>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "24px 24px 0", flexShrink: 0, background: "linear-gradient(160deg, #18181B 0%, #2d2d30 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, lineHeight: 1.1, color: "white" }}>Recipes</h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </p>
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
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none", opacity: 0.5 }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes, tags…"
              className="recipes-search"
              style={{
                width: "100%", padding: "10px 14px 10px 36px",
                border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: "var(--r-full)",
                fontSize: 14, background: "rgba(255,255,255,0.1)", outline: "none",
                transition: "border-color 0.15s", color: "white",
              }}
              onFocus={e => e.target.style.borderColor = "var(--fire)"}
              onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
            />
          </div>

          {/* Category pills */}
          <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 14, WebkitOverflowScrolling: "touch" }}>
            <button onClick={() => setActiveCategory("All")} style={pillStyle(activeCategory === "All")}>
              All <span style={{ opacity: 0.7, fontSize: 11 }}>({recipes.length})</span>
            </button>

            {favoritesCount > 0 && (
              <button onClick={() => setActiveCategory("Favorites")} style={pillStyle(activeCategory === "Favorites")}>
                ♥ Favorites <span style={{ opacity: 0.7, fontSize: 11 }}>({favoritesCount})</span>
              </button>
            )}

            {CATEGORY_OPTIONS.map(c => {
              const count = counts[c.name] || 0;
              if (!count) return null;
              return (
                <button key={c.name} onClick={() => setActiveCategory(c.name)} style={pillStyle(activeCategory === c.name)}>
                  {c.name} <span style={{ opacity: 0.7, fontSize: 11 }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px", paddingBottom: "calc(var(--nav-h) + 16px)" }}>
          {filtered.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
              {filtered.map(r => (
                <RecipeCard
                  key={r.id} recipe={r}
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
                <button onClick={onNewRecipe} style={{ marginTop: 8, padding: "10px 24px", background: "var(--fire)", color: "white", borderRadius: "var(--r-full)", fontSize: 14, fontWeight: 600 }}>
                  + Add your first recipe
                </button>
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
        onNavigateRecipe={onNavigateRecipe}
        recipes={recipes}
      />

      <style>{`.recipes-search::placeholder { color: rgba(255,255,255,0.35); }`}</style>
    </>
  );
}
