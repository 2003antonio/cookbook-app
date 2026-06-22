import { useState } from "react";
import { StarRating } from "../ui/StarRating";
import { StepList }   from "../ui/StepList";
import { formatTime, formatIngredient } from "../../hooks/useRecipes";

export function RecipePreviewSheet({ recipe, onClose, onAddToShopping }) {
  const [activeTab,  setActiveTab]  = useState("ingredients");
  const [servings,   setServings]   = useState(null);
  const [addedToast, setAddedToast] = useState(false);

  if (!recipe) return null;

  const currentServings = servings ?? recipe.baseServings ?? 4;
  const multiplier      = currentServings / (recipe.baseServings || 1);

  const handleClose = () => { setServings(null); setActiveTab("ingredients"); onClose(); };

  const handleAddToShopping = () => {
    onAddToShopping(recipe);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const tabs      = ["ingredients", "steps", ...(recipe.notes ? ["notes"] : [])];
  const noteLines = recipe.notes
    ? recipe.notes.split("\n").map(l => l.trim()).filter(Boolean)
    : [];

  return (
    <>
      {/* Scrim */}
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)", zIndex: 90 }} />

      {/* Sheet */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, height: "88vh", background: "white", borderRadius: "24px 24px 0 0", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)", zIndex: 91, display: "flex", flexDirection: "column" }}>

        {/* Hero */}
        <div style={{ background: recipe.color, padding: "48px 24px 28px", position: "relative", flexShrink: 0 }}>
          <button onClick={handleClose} style={{ position: "absolute", top: 16, right: 16, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.22)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>{recipe.category}</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "white", lineHeight: 1.15, marginBottom: 10 }}>{recipe.name}</h2>
          <StarRating rating={recipe.rating || 0} />
        </div>

        {/* Info row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--border)" }}>
          {[
            { label: "Prep",  val: recipe.prepTime ? `${recipe.prepTime}m` : "—" },
            { label: "Cook",  val: recipe.cookTime ? `${recipe.cookTime}m` : "—" },
            { label: "Total", val: formatTime(recipe.prepTime, recipe.cookTime) },
            { label: "Servings" },
          ].map((p, i, arr) => (
            <div key={p.label} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "14px 8px 20px",
              borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
              background: p.label === "Servings" ? "var(--surface)" : "none",
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "var(--ink-faint)" }}>{p.label}</span>
              {p.label === "Servings" ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 999, overflow: "hidden", background: "white" }}>
                    <button onClick={() => setServings(Math.max(1, currentServings - 1))} style={{ width: 32, height: 32 }}>−</button>
                    <span style={{ width: 32, textAlign: "center" }}>{currentServings}</span>
                    <button onClick={() => setServings(currentServings + 1)} style={{ width: 32, height: 32 }}>+</button>
                  </div>
                  {multiplier !== 1 && (
                    <button onClick={() => setServings(null)} style={{ fontSize: 12, color: "var(--fire)", textDecoration: "underline", position: "absolute", bottom: -18 }}>reset</button>
                  )}
                </div>
              ) : (
                <span style={{ fontWeight: 600 }}>{p.val}</span>
              )}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px", gap: 12 }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: "12px",
              color: activeTab === tab ? "var(--fire)" : "var(--ink-soft)",
              borderBottom: activeTab === tab ? "2px solid var(--fire)" : "none",
              textTransform: "capitalize",
            }}>{tab}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
          {activeTab === "ingredients" && (
            <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(recipe.ingredients || []).map(ing => (
                <li key={ing.id} style={{ display: "flex", gap: 10, fontSize: 13.5, color: "var(--ink)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--fire)", marginTop: 6 }} />
                  {formatIngredient(ing, multiplier)}
                </li>
              ))}
            </ul>
          )}
          {activeTab === "steps" && <StepList steps={recipe.steps} />}
          {activeTab === "notes" && (
            <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {noteLines.map((line, i) => (
                <li key={i} style={{ display: "flex", gap: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--fire)", marginTop: 6 }} />
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px 32px", borderTop: "1px solid var(--border)" }}>
          <button onClick={handleAddToShopping} style={{ width: "100%", padding: "10px", borderRadius: "var(--r-md)", background: addedToast ? "#22c55e" : "var(--fire)", color: "white", fontWeight: 600 }}>
            {addedToast ? "✓ Added to shopping list!" : "🛒 Add ingredients to list"}
          </button>
        </div>
      </div>
    </>
  );
}
