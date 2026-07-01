import { useState, useEffect } from "react";
import { RecipeDetail } from "./RecipeDetail";
import { BottomSheet } from "../ui/BottomSheet";

export function DetailSheet({ recipe, onClose, onEdit, onDelete, onToggleFavorite, onAddToShopping, onNavigateRecipe, recipes }) {
  const [navStack,     setNavStack]     = useState([]);
  const [stackExiting, setStackExiting] = useState(false);

  // Reset stack when the base recipe changes
  useEffect(() => { setNavStack([]); }, [recipe?.id]);

  const currentRecipe = navStack.length > 0
    ? (recipes || []).find(r => r.id === navStack[navStack.length - 1]) ?? recipe
    : recipe;

  const handleInternalNavigate = (recipeId) => {
    setStackExiting(false);
    setNavStack(s => [...s, recipeId]);
  };

  const handleBack = () => {
    setStackExiting(true);
    setTimeout(() => {
      setNavStack(s => s.slice(0, -1));
      setStackExiting(false);
    }, 260);
  };

  return (
    <BottomSheet open={!!recipe} onClose={onClose} height="92vh" closeDurationMs={360}>
      {(closeSheet) => (
        <>
          {recipe && (
            <>
              {/* Base recipe */}
              <div style={{ position: "absolute", inset: 0, overflowY: "auto" }}>
                <RecipeDetail
                  key={recipe.id}
                  recipe={recipe}
                  onClose={closeSheet}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleFavorite={onToggleFavorite}
                  onAddToShopping={onAddToShopping}
                  onNavigateRecipe={handleInternalNavigate}
                  recipes={recipes}
                />
              </div>

              {/* Stacked recipe — slides up over the base, slides down when dismissed */}
              {navStack.length > 0 && (
                <div style={{
                  position: "absolute", inset: 0, background: "var(--card-bg)", overflowY: "auto",
                  animation: stackExiting
                    ? "stackSlideOut 0.36s cubic-bezier(0.4,0,0.2,1) forwards"
                    : "stackSlideIn 0.36s cubic-bezier(0.4,0,0.2,1)",
                }}>
                  <RecipeDetail
                    key={currentRecipe?.id}
                    recipe={currentRecipe}
                    onClose={handleBack}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleFavorite={onToggleFavorite}
                    onAddToShopping={onAddToShopping}
                    onNavigateRecipe={handleInternalNavigate}
                    recipes={recipes}
                  />
                </div>
              )}
            </>
          )}

          <style>{`
            @keyframes stackSlideIn  { from { transform: translateY(100%) } to { transform: translateY(0) } }
            @keyframes stackSlideOut { from { transform: translateY(0) } to { transform: translateY(100%) } }
          `}</style>
        </>
      )}
    </BottomSheet>
  );
}
