import { useState, useRef } from "react";
import { StarRating } from "../ui/StarRating";
import { StepList }   from "../ui/StepList";
import { showToast }  from "../ui/ToastHost";
import { formatTime, formatIngredient } from "../../models/recipe";

// ── Small helper ─────────────────────────────────────────────────────────────
function HeroBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 34, height: 34, borderRadius: "50%",
        background: "rgba(255,255,255,0.22)", backdropFilter: "blur(4px)",
        color: "white", fontSize: 14,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.38)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
    >{children}</button>
  );
}

// ── Servings stepper ──────────────────────────────────────────────────────────
function ServingsStepper({ value, onChange, onReset, showReset }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      <div style={{
        display: "flex", alignItems: "center",
        border: "1.5px solid var(--border)", borderRadius: 999,
        overflow: "hidden", background: "white",
      }}>
        <button
          style={{ width: 32, height: 32, fontSize: 18, color: "var(--fire)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer" }}
          onClick={() => onChange(Math.max(1, value - 1))}
        >−</button>
        <span style={{ width: 32, textAlign: "center", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{value}</span>
        <button
          style={{ width: 32, height: 32, fontSize: 18, color: "var(--fire)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer" }}
          onClick={() => onChange(value + 1)}
        >+</button>
      </div>
      {showReset && (
        <button
          style={{
            fontSize: 12, color: "var(--fire)", textDecoration: "underline",
            background: "none", border: "none", cursor: "pointer", padding: 0,
            position: "absolute", bottom: -18, left: "50%", transform: "translateX(-50%)",
            whiteSpace: "nowrap",
          }}
          onClick={onReset}
        >reset</button>
      )}
    </div>
  );
}

// ── Info row (Prep / Cook / Total / Servings) ─────────────────────────────────
function InfoRow({ recipe, currentServings, onServingsChange, onServingsReset, showReset }) {
  const cells = [
    { label: "Prep",  val: recipe.prepTime ? `${recipe.prepTime}m` : "—" },
    { label: "Cook",  val: recipe.cookTime ? `${recipe.cookTime}m` : "—" },
    { label: "Total", val: formatTime(recipe.prepTime, recipe.cookTime) },
    { label: "Servings" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--border)" }}>
      {cells.map((cell, i, arr) => (
        <div key={cell.label} style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "14px 8px 20px", gap: 3,
          borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
          background: cell.label === "Servings" ? "var(--surface)" : "none",
        }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-faint)" }}>
            {cell.label}
          </span>
          {cell.label === "Servings" ? (
            <ServingsStepper
              value={currentServings}
              onChange={onServingsChange}
              onReset={onServingsReset}
              showReset={showReset}
            />
          ) : (
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{cell.val}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Single ingredient row ─────────────────────────────────────────────────────
function IngredientRow({ ing, multiplier, checked, onToggle, onNavigateRecipe }) {
  const isRecipeLink = ing.type === "recipe";

  // Recipe-link ingredients render inline like a regular row with underlined name
  if (isRecipeLink) {
    const amt = ing.amount && ing.amount !== 1 ? `${ing.amount} × ` : "";
    return (
      <li
        onClick={() => onToggle(ing.id)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "9px 10px", borderRadius: "var(--r-sm)",
          cursor: "pointer", transition: "background 0.12s",
          background: checked ? "var(--surface)" : "transparent",
          userSelect: "none",
        }}
        onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "var(--surface)"; }}
        onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
          border: checked ? "none" : "2px solid var(--border)",
          background: checked ? "var(--fire)" : "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s ease",
          boxShadow: checked ? "0 1px 4px rgba(232,98,26,0.3)" : "none",
        }}>
          {checked && (
            <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
              <path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span style={{
          fontSize: 13.5, flex: 1,
          color: checked ? "var(--ink-faint)" : "var(--fire)",
          lineHeight: 1.4,
          textDecoration: checked ? "line-through" : "underline",
          textUnderlineOffset: 3,
          transition: "color 0.15s",
        }}>
          {amt}{ing.recipeName}
        </span>
      </li>
    );
  }

  return (
    <li
      onClick={() => onToggle(ing.id)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "9px 10px", borderRadius: "var(--r-sm)",
        cursor: "pointer", transition: "background 0.12s",
        background: checked ? "var(--surface)" : "transparent",
        userSelect: "none",
      }}
      onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "var(--surface)"; }}
      onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        border: checked ? "none" : "2px solid var(--border)",
        background: checked ? "var(--fire)" : "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s ease",
        boxShadow: checked ? "0 1px 4px rgba(232,98,26,0.3)" : "none",
      }}>
        {checked && (
          <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
            <path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{
        fontSize: 13.5, flex: 1,
        color: checked ? "var(--ink-faint)" : "var(--ink)",
        lineHeight: 1.4,
        textDecoration: checked ? "line-through" : "none",
        transition: "color 0.15s",
      }}>
        {formatIngredient(ing, multiplier)}
      </span>
    </li>
  );
}

// ── Ingredient checklist — component-aware ────────────────────────────────────
// Single component: renders flat (as before).
// Multi-component: renders each component as a labelled section.
function IngredientChecklist({ components, multiplier, checkedMap, onToggle, onClearAll, onNavigateRecipe }) {
  const allIngs    = components.flatMap(c => c.ingredients || []);
  const checkedCount = allIngs.filter(ing => checkedMap[ing.id]).length;
  const totalCount   = allIngs.length;
  const isSimple     = components.length === 1 && !components[0].name;

  const renderRows = (ingredients) => {
    const sorted = [...ingredients].sort((a, b) => {
      const ac = !!checkedMap[a.id], bc = !!checkedMap[b.id];
      if (ac === bc) return 0;
      return ac ? 1 : -1;
    });
    return (
      <ul style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {sorted.map(ing => (
          <IngredientRow
            key={ing.id}
            ing={ing}
            multiplier={multiplier}
            checked={!!checkedMap[ing.id]}
            onToggle={onToggle}
            onNavigateRecipe={onNavigateRecipe}
          />
        ))}
      </ul>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Progress bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-faint)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {checkedCount} of {totalCount} ready
          </span>
          {checkedCount === totalCount && totalCount > 0 && (
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "#22c55e" }}>All set! ✓</span>
          )}
        </div>
        <div style={{ height: 4, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 999,
            background: checkedCount === totalCount && totalCount > 0 ? "#22c55e" : "var(--fire)",
            width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : "0%",
            transition: "width 0.3s ease, background 0.3s ease",
          }} />
        </div>
      </div>

      {/* Ingredient rows — flat for simple recipes, sectioned for multi-component */}
      {isSimple
        ? renderRows(components[0].ingredients || [])
        : components.map(comp => {
            const ings = comp.ingredients || [];
            const allDone = ings.length > 0 && ings.every(i => checkedMap[i.id]);
            return (
              <div key={comp.id}>
                <CompHeading name={comp.name} yieldAmt={comp.yieldAmt} yieldUnit={comp.yieldUnit} multiplier={multiplier} done={allDone} />
                {renderRows(ings)}
              </div>
            );
          })
      }

      {checkedCount > 0 && (
        <button
          onClick={onClearAll}
          style={{
            alignSelf: "flex-start", fontSize: 12.5, color: "var(--ink-faint)",
            background: "none", border: "none", cursor: "pointer", padding: 0,
            textDecoration: "underline",
          }}
        >Clear all</button>
      )}
    </div>
  );
}

// ── Shared component section heading ─────────────────────────────────────────
function CompHeading({ name, yieldAmt, yieldUnit, multiplier = 1, done }) {
  const scaledYield = (() => {
    if (!yieldAmt && !yieldUnit) return null;
    if (!yieldAmt) return yieldUnit;
    const base = parseFloat(yieldAmt);
    if (isNaN(base)) return [yieldAmt, yieldUnit].filter(Boolean).join(" ");
    const scaled = base * multiplier;
    const display = Number.isInteger(scaled) ? scaled : +scaled.toFixed(2);
    return [display, yieldUnit].filter(Boolean).join(" ");
  })();

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 10, padding: "8px 12px", borderRadius: "var(--r-sm)",
      background: "rgba(232,98,26,0.07)", border: "1.5px solid rgba(232,98,26,0.2)",
      marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em",
          textTransform: "uppercase", color: "rgba(232,98,26,0.75)",
          background: "rgba(232,98,26,0.12)", padding: "2px 6px", borderRadius: 4, flexShrink: 0,
        }}>recipe</span>
        <span style={{
          fontSize: 13.5, fontWeight: 600, color: "var(--ink)", lineHeight: 1.4,
          textDecoration: done ? "line-through" : "none",
          opacity: done ? 0.45 : 1,
          transition: "opacity 0.2s, text-decoration 0.2s",
        }}>
          {name || "Main"}
        </span>
      </div>
      {scaledYield && (
        <span style={{ fontSize: 12, fontWeight: 400, color: "var(--ink-faint)", flexShrink: 0 }}>
          {scaledYield}
        </span>
      )}
    </div>
  );
}

// ── Steps — component-aware ───────────────────────────────────────────────────
function ComponentSteps({ components, multiplier = 1 }) {
  const isSimple = components.length === 1 && !components[0].name;

  if (isSimple) {
    return <StepList steps={components[0].steps} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {components.map(comp => (
        <div key={comp.id}>
          <CompHeading name={comp.name} yieldAmt={comp.yieldAmt} yieldUnit={comp.yieldUnit} multiplier={multiplier} />
          <StepList steps={comp.steps} />
          {comp.holding && (
            <p style={{ marginTop: 10, fontSize: 12.5, color: "var(--ink-soft)", fontStyle: "italic", lineHeight: 1.5 }}>
              <strong>Holding:</strong> {comp.holding}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Components tab ────────────────────────────────────────────────────────────
// Named components shown as linked-recipe cards.
// Saveable as standalone (＋) or navigatable once saved (↗).
// If the linked recipe was deleted, falls back to showing the save option.
// Recipe-link ingredients are already visible in the ingredients tab.
function ComponentsTab({ components, recipes, onNavigateRecipe, onCreateFromComponent }) {
  const namedComponents = components.filter(c => c.name);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

      {/* Named components as save/link cards */}
      {namedComponents.map(comp => {
        // Guard: treat as unlinked if the linked recipe has since been deleted
        const linkedExists = comp.linkedRecipeId && (recipes || []).some(r => r.id === comp.linkedRecipeId);

        if (linkedExists) {
          return (
            <button
              key={comp.id}
              onClick={() => onNavigateRecipe && onNavigateRecipe(comp.linkedRecipeId)}
              style={{
                width: "100%", textAlign: "left", padding: "14px 16px",
                background: "var(--fire-dim)", border: "1.5px solid var(--fire)",
                borderRadius: "var(--r-md)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "background 0.15s, box-shadow 0.15s, transform 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(232,98,26,0.18)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(232,98,26,0.2)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--fire-dim)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fire)", marginBottom: 3 }}>{comp.name}</p>
                <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>Tap to view recipe</p>
              </div>
              <span style={{ fontSize: 16, color: "var(--fire)" }}>↗</span>
            </button>
          );
        }

        return (
          <button
            key={comp.id}
            onClick={() => onCreateFromComponent && onCreateFromComponent(comp)}
            disabled={!onCreateFromComponent}
            style={{
              width: "100%", textAlign: "left", padding: "14px 16px",
              background: "var(--surface)", border: "1.5px solid var(--border)",
              borderRadius: "var(--r-md)", cursor: onCreateFromComponent ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              opacity: 0.7, transition: "opacity 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.12s",
            }}
            onMouseEnter={e => { if (!onCreateFromComponent) return; e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = "var(--fire)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(232,98,26,0.15)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "0.7"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 3 }}>{comp.name}</p>
              <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>Not yet saved as a recipe</p>
            </div>
            {onCreateFromComponent && (
              <span style={{ fontSize: 18, color: "var(--fire)", opacity: 0.8 }}>＋</span>
            )}
          </button>
        );
      })}

    </div>
  );
}

// ── RecipeDetail ──────────────────────────────────────────────────────────────
export function RecipeDetail({ recipe, onClose, onEdit, onDelete, onToggleFavorite, onAddToShopping, onNavigateRecipe, onCreateFromComponent, recipes }) {
  const [activeTab,          setActiveTab]          = useState("ingredients");
  const [servings,           setServings]            = useState(null);
  const [confirmDelete,      setConfirmDelete]       = useState(false);
  const [addedToast,         setAddedToast]          = useState(false);
  const [isFavorite,         setIsFavorite]          = useState(recipe?.favorite ?? false);
  const [checkedIngredients, setCheckedIngredients]  = useState({});
  const lastRecipeId = useRef(recipe?.id);

  // Sync local state when a different recipe is opened
  if (recipe?.id !== lastRecipeId.current) {
    lastRecipeId.current = recipe?.id;
    setIsFavorite(recipe?.favorite ?? false);
    setCheckedIngredients({});
  }

  if (!recipe) return null;

  const components      = recipe.components || [];
  const currentServings = servings ?? recipe.baseServings ?? 4;
  const multiplier      = currentServings / (recipe.baseServings || 1);

  const handleToggleFavorite = () => { setIsFavorite(f => !f); onToggleFavorite(recipe.id); };
  const handleClose          = () => { setServings(null); setConfirmDelete(false); setCheckedIngredients({}); onClose(); };
  const handleAddToShopping  = () => { onAddToShopping(recipe); setAddedToast(true); setTimeout(() => setAddedToast(false), 2000); };

  // Show components tab when there are multiple named components or any recipe-link ingredients
  // Only show components tab for genuinely named sub-components —
  // a single component whose name matches the recipe name is not a real sub-component.
  const showComponentsTab = components.some(
    c => c.name && !(components.length === 1 && c.name.trim().toLowerCase() === recipe.name.trim().toLowerCase())
  );

  const tabs = [
    "ingredients",
    "steps",
    ...(showComponentsTab ? ["components"] : []),
    ...(recipe.notes ? ["notes"] : []),
  ];
  const noteLines = recipe.notes
    ? recipe.notes.split("\n").map(l => l.trim()).filter(Boolean)
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Hero */}
      <div style={{ background: recipe.color, padding: "48px 24px 28px", position: "relative", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
          <HeroBtn onClick={handleToggleFavorite} title={isFavorite ? "Unfavorite" : "Favorite"}>
            {isFavorite ? "♥" : "♡"}
          </HeroBtn>
          <HeroBtn onClick={() => onEdit(recipe)} title="Edit">✏️</HeroBtn>
          <HeroBtn onClick={handleClose} title="Close">✕</HeroBtn>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
          {recipe.category}
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "white", lineHeight: 1.15, marginBottom: 10, textShadow: "0 1px 6px rgba(0,0,0,0.18)" }}>
          {recipe.name}
        </h2>
        <StarRating rating={recipe.rating || 0} />
      </div>

      {/* Info row */}
      <InfoRow
        recipe={recipe}
        currentServings={currentServings}
        onServingsChange={setServings}
        onServingsReset={() => setServings(null)}
        showReset={multiplier !== 1}
      />

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px", gap: "12px" }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, textAlign: "center",
            padding: "12px 14px", fontSize: 13.5, fontWeight: 500,
            color: activeTab === tab ? "var(--fire)" : "var(--ink-soft)",
            borderBottom: activeTab === tab ? "2px solid var(--fire)" : "2px solid transparent",
            marginBottom: -1, textTransform: "capitalize", transition: "color 0.15s",
          }}>{tab}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
        {activeTab === "ingredients" && (
          <IngredientChecklist
            components={components}
            multiplier={multiplier}
            checkedMap={checkedIngredients}
            onToggle={id => setCheckedIngredients(prev => ({ ...prev, [id]: !prev[id] }))}
            onClearAll={() => setCheckedIngredients({})}
            onNavigateRecipe={onNavigateRecipe}
          />
        )}
        {activeTab === "steps" && <ComponentSteps components={components} multiplier={multiplier} />}
        {activeTab === "components" && (
          <ComponentsTab
            components={components}
            recipes={recipes}
            onNavigateRecipe={onNavigateRecipe}
            onCreateFromComponent={comp => onCreateFromComponent(comp, recipe.id)}
          />
        )}
        {activeTab === "notes" && (
          <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {noteLines.map((line, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.6 }}>
                <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: "50%", background: "var(--fire)", flexShrink: 0 }} />
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 20px 40px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={handleAddToShopping}
          style={{
            width: "100%", padding: "8px", borderRadius: "var(--r-md)",
            background: addedToast ? "#22c55e" : "var(--fire)", color: "white",
            fontSize: 13.5, fontWeight: 600, transition: "background 0.3s",
          }}
        >
          {addedToast ? "✓ Added to shopping list!" : "🛒 Add ingredients to shopping list"}
        </button>

        {confirmDelete ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { const name = recipe.name; onDelete(recipe.id); handleClose(); showToast(`"${name}" successfully deleted`); }}
              style={{ flex: 1, padding: "5.5px", background: "#ef4444", color: "white", borderRadius: "var(--r-sm)", fontSize: 13, fontWeight: 600 }}
            >Yes, delete</button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{ flex: 1, padding: "5.5px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", fontSize: 13, color: "var(--ink-soft)" }}
            >Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              padding: "5px", fontSize: 13.5, fontWeight: 500,
              color: "#ef4444", background: "#fef2f2",
              border: "1px solid #fee2e2", borderRadius: "var(--r-md)",
              cursor: "pointer", transition: "all 0.15s ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.borderColor = "#fee2e2"; }}
          >🗑 Delete recipe</button>
        )}
      </div>
    </div>
  );
}
