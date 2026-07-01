import { useState } from "react";
import { StarRating }  from "../ui/StarRating";
import { StepList }    from "../ui/StepList";
import { IconButton }  from "../ui/IconButton";
import { BottomSheet } from "../ui/BottomSheet";
import { useSlideDirection } from "../../hooks/useSlideDirection";
import { formatTime, formatIngredient, normalizeRecipe } from "../../models/recipe";

// Stays mounted at all times (like DetailSheet) so `open` toggling from false
// → true is a real transition on an already-rendered node — that's what
// produces the pull-up-from-the-bottom entrance. Conditionally mounting the
// whole sheet based on `recipe` (the old approach) meant `open` was already
// true on the very first paint, so there was nothing for BottomSheet to
// transition from and it just appeared instantly.
export function RecipePreviewSheet({ recipe, onClose, onAddToShopping }) {
  const [activeTab,  setActiveTab]  = useState("ingredients");
  const [servings,   setServings]   = useState(null);
  const [addedToast, setAddedToast] = useState(false);

  // Computed defensively (recipe can be null here) so this hook call stays
  // unconditional regardless of whether a recipe is currently open.
  const tabs = recipe ? ["ingredients", "steps", ...(recipe.notes ? ["notes"] : [])] : ["ingredients"];
  const { direction: tabSlideDir, hasSwitched: hasTabSwitched } = useSlideDirection(activeTab, tabs);

  // Reset local view state right before handing off to the real onClose, same
  // as before — so reopening this sheet on a different recipe always starts on
  // the Ingredients tab at the base serving size. BottomSheet only calls this
  // after its own close animation finishes, so `recipe` stays truthy (and the
  // content below keeps rendering) for the whole slide-down.
  const handleSheetClose = () => {
    setServings(null);
    setActiveTab("ingredients");
    onClose();
  };

  return (
    <BottomSheet open={!!recipe} onClose={handleSheetClose} height="88vh" closeDurationMs={340}>
      {(closeSheet) => recipe && (() => {
        const normalized      = normalizeRecipe(recipe);
        const parts           = normalized.parts || [];
        const isSimple        = parts.length === 1 && !parts[0].name;
        const currentServings = servings ?? recipe.baseServings ?? 4;
        const multiplier      = currentServings / (recipe.baseServings || 1);

        const handleAddToShopping = () => {
          onAddToShopping(recipe);
          setAddedToast(true);
          setTimeout(() => setAddedToast(false), 2000);
        };

        const noteLines = recipe.notes
          ? recipe.notes.split("\n").map(l => l.trim()).filter(Boolean)
          : [];

        return (
          <>
            {/* Hero */}
            <div style={{
              background: recipe.color,
              backgroundImage: recipe.image
                ? `linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.5)), url(${recipe.image})`
                : undefined,
              backgroundSize: "cover", backgroundPosition: "center",
              padding: "20px 24px 28px", position: "relative", flexShrink: 0,
            }}>
              <IconButton
                onClick={closeSheet} ariaLabel="Close"
                background="rgba(255,255,255,0.22)" color="white"
                style={{ position: "absolute", top: 16, right: 16 }}
              >✕</IconButton>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>{recipe.category}</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "white", lineHeight: 1.15, marginBottom: 10, textShadow: recipe.image ? "0 1px 6px rgba(0,0,0,0.25)" : undefined }}>{recipe.name}</h2>
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
                      <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 999, overflow: "hidden", background: "var(--surface)" }}>
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

            {/* Content — animated sweep, keyed by activeTab so it replays on every switch */}
            <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
              <div
                key={activeTab}
                className={hasTabSwitched ? `tab-panel tab-panel--${tabSlideDir >= 0 ? "next" : "prev"}` : undefined}
              >
                {activeTab === "ingredients" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: isSimple ? 0 : 20 }}>
                    {parts.map((part, idx) => (
                      <div key={part.id}>
                        {!isSimple && (part.name || part.description) && (
                          <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "7px 12px", marginBottom: 8,
                            background: "rgba(232,98,26,0.07)", border: "1.5px solid rgba(232,98,26,0.2)",
                            borderRadius: "var(--r-sm)",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 13, flexShrink: 0 }}>{part.icon || (idx + 1)}</span>
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{part.name || `Part ${idx + 1}`}</span>
                            </div>
                            {part.description && <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>{part.description}</span>}
                          </div>
                        )}
                        <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {(part.ingredients || []).map(ing => (
                            <li key={ing.id} style={{ display: "flex", gap: 10, fontSize: 13.5, color: "var(--ink)" }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--fire)", marginTop: 6, flexShrink: 0 }} />
                              {formatIngredient(ing, multiplier)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "steps" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {parts.map((part, i) => (
                      <div key={part.id}>
                        {part.name && (
                          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 8 }}>
                            {part.icon ? `${part.icon} ` : ""}{part.name}
                          </p>
                        )}
                        <StepList steps={part.steps} />
                      </div>
                    ))}
                  </div>
                )}
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
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 20px 32px", borderTop: "1px solid var(--border)" }}>
              <button onClick={handleAddToShopping} style={{ width: "100%", padding: "10px", borderRadius: "var(--r-md)", background: addedToast ? "var(--success)" : "var(--fire)", color: "white", fontWeight: 600 }}>
                {addedToast ? "✓ Added to shopping list!" : "🛒 Add ingredients to list"}
              </button>
            </div>
          </>
        );
      })()}
    </BottomSheet>
  );
}
