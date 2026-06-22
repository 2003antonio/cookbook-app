import { useState } from "react";
import { FavoritesCarousel }               from "../components/home/FavoritesCarousel";
import { RecipePreviewSheet }              from "../components/home/RecipePreviewSheet";
import { RecentRow, FavoritePickerSheet }  from "../components/home/HomeComponents";
import { useAuth }       from "../hooks/useAuth";
import ProfileButton     from "../components/auth/ProfileButton";

export default function HomeScreen({
  recipes, onGoToRecipes, onOpenRecipe, onNewRecipe, onAddToShopping, onToggleFavorite,
}) {
  const [previewRecipe,      setPreviewRecipe]      = useState(null);
  const [favoritePickerOpen, setFavoritePickerOpen] = useState(false);
  const { session, loading: authLoading } = useAuth();

  const favorites  = recipes.filter(r => r.favorite);
  const recent     = recipes.slice(0, 6);
  const totalTime  = recipes.reduce((s, r) => s + (r.prepTime || 0) + (r.cookTime || 0), 0);
  const avgTime    = recipes.length ? `${Math.round(totalTime / recipes.length)}m` : "—";

  const stats = [
    { label: "Recipes",   val: recipes.length,   filter: "All"       },
    { label: "Favorites", val: favorites.length,  filter: "Favorites" },
    { label: "Avg time",  val: avgTime,           filter: null        },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: "calc(var(--nav-h) + 16px)" }}>
      {/* Header */}
      <div style={{ padding: "32px 24px 24px", background: "linear-gradient(160deg, var(--ink) 0%, #2d2d30 100%)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fire)" }}>
            Touch of Zade
          </p>
          <ProfileButton session={session} loading={authLoading} />
        </div>
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
                  flex: 1, background: "rgba(255,255,255,0.07)",
                  borderRadius: "var(--r-md)", padding: "12px 14px",
                  backdropFilter: "blur(8px)", textAlign: "left", border: "none",
                  cursor: clickable ? "pointer" : "default",
                  transition: clickable ? "background 0.15s" : "none",
                }}
                onMouseEnter={e => { if (clickable) e.currentTarget.style.background = "rgba(255,255,255,0.13)"; }}
                onMouseLeave={e => { if (clickable) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              >
                <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "white", lineHeight: 1 }}>{s.val}</div>
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
        {/* Favorites carousel */}
        {favorites.length > 0 ? (
          <FavoritesCarousel favorites={favorites} onSelect={setPreviewRecipe} onAddNew={() => setFavoritePickerOpen(true)} />
        ) : (
          <button
            onClick={() => setFavoritePickerOpen(true)}
            style={{ width: "100%", background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "28px 24px", textAlign: "center", border: "2px dashed var(--border)", cursor: "pointer" }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>♡</div>
            <p style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)", marginBottom: 4 }}>No favorites yet</p>
            <p style={{ fontSize: 13, color: "var(--ink-faint)" }}>Tap to choose a recipe to favorite</p>
          </button>
        )}

        {/* Recent recipes */}
        {recent.length > 0 && (
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
              Recent
            </h2>
            <div>
              {recent.map(r => <RecentRow key={r.id} recipe={r} onSelect={onOpenRecipe} />)}
            </div>
          </div>
        )}

        {/* Empty state CTA */}
        {recipes.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 20 }}>
            <p style={{ fontSize: 15, color: "var(--ink-soft)", marginBottom: 16 }}>Start building your cookbook</p>
            <button onClick={onNewRecipe} style={{ padding: "12px 28px", background: "var(--fire)", color: "white", borderRadius: "var(--r-full)", fontSize: 15, fontWeight: 600, boxShadow: "var(--shadow-md)" }}>
              + Add your first recipe
            </button>
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

      {/* Favorite picker */}
      {favoritePickerOpen && (
        <FavoritePickerSheet
          recipes={recipes}
          onClose={() => setFavoritePickerOpen(false)}
          onToggleFavorite={onToggleFavorite}
          onNewRecipe={onNewRecipe}
        />
      )}
    </div>
  );
}
