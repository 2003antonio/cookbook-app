import { useState, useEffect, useRef } from "react";
import { RecipeDetail } from "./RecipeDetail";

export function DetailSheet({ recipe, onClose, onEdit, onDelete, onToggleFavorite, onAddToShopping }) {
  const [dragY,       setDragY]       = useState(0);
  const [isDragging,  setIsDragging]  = useState(false);
  const startY = useRef(0);

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (!recipe) return;
    const original = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [recipe]);

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
    if (dragY > 200) onClose();
    setDragY(0);
  };

  return (
    <>
      {recipe && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)",
            zIndex: 90, animation: "fadeIn 0.2s ease",
          }}
        />
      )}

      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0,
        height: "92vh", background: "white",
        borderRadius: "24px 24px 0 0",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
        zIndex: 91, overflow: "hidden", flexDirection: "column",
        transform: recipe ? `translateY(${dragY}px)` : "translateY(100%)",
        transition: isDragging ? "none" : "transform 0.36s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {/* Drag handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: "sticky", top: 0, zIndex: 1, background: "white",
            padding: "10px 0 5px", display: "flex", justifyContent: "center",
            cursor: "grab", touchAction: "none",
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

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </>
  );
}
