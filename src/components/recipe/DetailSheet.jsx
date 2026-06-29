import { useState, useEffect, useRef } from "react";
import { RecipeDetail } from "./RecipeDetail";

export function DetailSheet({ recipe, onClose, onEdit, onDelete, onToggleFavorite, onAddToShopping, onNavigateRecipe, recipes }) {
  const [dragY,       setDragY]       = useState(0);
  const [isDragging,  setIsDragging]  = useState(false);
  const [closing,     setClosing]     = useState(false);
  const [navStack,    setNavStack]    = useState([]);
  const [stackExiting, setStackExiting] = useState(false);
  const startY = useRef(0);

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

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (!recipe) return;
    const original = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [recipe]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 360);
  };

  const handleTouchStart = e => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = e => {
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setDragY(delta);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 200) {
      handleClose();
    }
    setDragY(0);
  };

  // During drag: follow finger. When closing: slide to 100%. Otherwise: open at 0 or hidden at 100%.
  const getTransform = () => {
    if (isDragging)  return `translateY(${dragY}px)`;
    if (closing)     return "translateY(100%)";
    if (recipe)      return "translateY(0)";
    return "translateY(100%)";
  };

  return (
    <>
      {recipe && (
        <div
          onClick={handleClose}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)",
            zIndex: 90,
            opacity: closing ? 0 : 1,
            transition: "opacity 0.36s cubic-bezier(0.4, 0, 0.2, 1)",
            animation: closing ? undefined : "fadeIn 0.2s ease",
          }}
        />
      )}

      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0,
        height: "92vh", background: "var(--card-bg)",
        borderRadius: "24px 24px 0 0",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
        zIndex: 91, overflow: "hidden",
        display: "flex", flexDirection: "column",
        transform: getTransform(),
        transition: isDragging ? "none" : "transform 0.36s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {/* Drag handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            flexShrink: 0, background: "var(--card-bg)",
            padding: "10px 0 5px", display: "flex", justifyContent: "center",
            cursor: "grab", touchAction: "none",
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--border)" }} />
        </div>

        {/* Content area — base recipe sits here; stacked recipe overlays it */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {recipe && (
            <>
              {/* Base recipe */}
              <div style={{ position: "absolute", inset: 0, overflowY: "auto" }}>
                <RecipeDetail
                  key={recipe.id}
                  recipe={recipe}
                  onClose={handleClose}
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
        </div>
      </div>

      <style>{`
        @keyframes fadeIn      { from { opacity: 0 } to { opacity: 1 } }
        @keyframes stackSlideIn  { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes stackSlideOut { from { transform: translateY(0) } to { transform: translateY(100%) } }
      `}</style>
    </>
  );
}
