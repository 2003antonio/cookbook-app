// ── Recipe Model ──────────────────────────────────────────────────────────────
// Single source of truth for what a recipe is.
//
// SHAPE OVERVIEW
// ──────────────
// A recipe is made of one or more Components. Each component is a self-
// contained sub-recipe with its own ingredients and steps. Simple recipes
// (Vermont Cheddar Soup) have exactly one component. Complex dishes
// (Southern Fried Chicken, Boston Cream Pie) have multiple.
//
// A component's ingredient list can contain two subtypes:
//   type: "ingredient"  — a raw ingredient (flour, butter, salt…)
//   type: "recipe"      — a link to another recipe by ID
//                         ("1 recipe Pastry Cream Filling")
//
// Recipe linking means components can reference other saved recipes as
// ingredients — clicking the link navigates to that recipe.
//
// Recipe
//   ├── metadata (name, category, color, rating, tags, notes…)
//   └── components[]
//         ├── id, name, yield, holding, notes
//         ├── ingredients[]
//         │     ├── { type:"ingredient", id, amount, unit, name }
//         │     └── { type:"recipe",     id, amount, unit, recipeId, recipeName }
//         └── steps[]
//               └── { id, text, substeps[{ id, text }] }
//
// When adding new recipe fields, start here.

// ── Field options ─────────────────────────────────────────────────────────────
export const UNITS = [
  { value: "quart",  label: "quart"  },
  { value: "cup",    label: "cup"    },
  { value: "tbsp",   label: "tbsp"   },
  { value: "tsp",    label: "tsp"    },
  { value: "oz",     label: "oz"     },
  { value: "lb",     label: "lb"     },
  { value: "g",      label: "g"      },
  { value: "kg",     label: "kg"     },
  { value: "ml",     label: "ml"     },
  { value: "l",      label: "l"      },
  { value: "whole",  label: "whole"  },
  { value: "pinch",  label: "pinch"  },
  { value: "recipe", label: "recipe" }, // used by recipe-link ingredients
  { value: "",       label: "none"   },
];

export const CATEGORY_OPTIONS = [
  { name: "Breakfast", emoji: "🍳" },
  { name: "Appetizer", emoji: "🥗" },
  { name: "Main Dish", emoji: "🍖" },
  { name: "Side Dish", emoji: "🍟" },
  { name: "Soup",      emoji: "🍲" },
  { name: "Dessert",   emoji: "🍰" },
  { name: "Baking",    emoji: "🧁" },
  { name: "Beverage",  emoji: "🍹" },
];

export const CARD_COLORS = [
  "#F5C842", "#E86038", "#6B9E5E", "#5B8DB8", "#C4956A",
];

// ── ID generator (client-side only, never parsed or displayed) ────────────────
function genId(prefix) {
  return `${prefix}${Date.now()}${Math.random()}`;
}

// ── Ingredient factories ──────────────────────────────────────────────────────

// A raw ingredient (flour, butter, salt…)
export function newIngredient() {
  return { id: genId("i"), type: "ingredient", amount: "", unit: "cup", name: "" };
}

// A link to another saved recipe used as an ingredient.
// recipeId is null until the user selects a recipe.
export function newRecipeLink() {
  return { id: genId("rl"), type: "recipe", amount: 1, unit: "recipe", recipeId: null, recipeName: "" };
}

// ── Step factories ────────────────────────────────────────────────────────────

// Steps support sub-parts: Step 1, 1a, 1b … Step 2, 2a …
// Shape: { id, text, substeps: [{ id, text }] }
export function newStep() {
  return { id: genId("step"), text: "", substeps: [] };
}

export function newSubstep() {
  return { id: genId("sub"), text: "" };
}

// a, b, c … z, then s27, s28 … as a safety fallback past 26 sub-steps
export function subLetter(idx) {
  return idx < 26 ? String.fromCharCode(97 + idx) : `s${idx + 1}`;
}

// ── Component factory ─────────────────────────────────────────────────────────
// A component is a named sub-recipe. For simple recipes the name is empty —
// the component IS the dish. For complex dishes each component is distinct:
// "Buttermilk-Marinated Frying Chicken", "Down-Home Green Beans", etc.
export function newComponent(name = "") {
  return {
    id:          genId("comp"),
    name,
    yieldAmt:    "",   // numeric amount, scales with servings — e.g. 1, 4
    yieldUnit:   "",   // label/unit — e.g. "qt.", "servings", "(1¼-lb.) portions"
    ingredients: [newIngredient(), newIngredient(), newIngredient()],
    steps:       [newStep(), newStep()],
    holding:     "",   // storage/holding instructions — optional
    notes:       "",   // chef's notes for this component — optional
  };
}

// ── Parse a legacy free-text yield string into { yieldAmt, yieldUnit } ────────
// Tries to extract a leading number (int or decimal). The remainder becomes unit.
function parseYield(str) {
  if (!str) return { yieldAmt: "", yieldUnit: "" };
  const m = str.trim().match(/^(\d+(?:\.\d+)?)\s*(.*)/);
  if (m) return { yieldAmt: m[1], yieldUnit: m[2].trim() };
  return { yieldAmt: "", yieldUnit: str.trim() };
}


// ── Step normalization ────────────────────────────────────────────────────────
// Accepts legacy flat-string steps OR current { id, text, substeps } shape.
// Always returns the latter with ids filled in.
export function normalizeSteps(steps) {
  if (!steps || !steps.length) return [newStep()];
  return steps.map(s => {
    if (typeof s === "string") return { id: genId("step"), text: s, substeps: [] };
    return {
      id:       s.id || genId("step"),
      text:     s.text || "",
      substeps: (s.substeps || []).map(sub =>
        typeof sub === "string"
          ? { id: genId("sub"), text: sub }
          : { id: sub.id || genId("sub"), text: sub.text || "" }
      ),
    };
  });
}

// Read-only flattening for display — tolerates legacy shapes.
export function stepsForDisplay(steps) {
  return (steps || [])
    .map(s =>
      typeof s === "string"
        ? { text: s, substeps: [] }
        : {
            text:     s.text || "",
            substeps: (s.substeps || []).map(sub =>
              typeof sub === "string" ? sub : (sub.text || "")
            ),
          }
    )
    .filter(s => s.text || s.substeps.some(t => t));
}

// ── Ingredient normalization ──────────────────────────────────────────────────
// Ensures every ingredient has a type field (migrates legacy shape that had none).
export function normalizeIngredient(ing) {
  if (ing.type === "recipe") return ing;
  return { type: "ingredient", ...ing };
}

// ── Recipe normalization ──────────────────────────────────────────────────────
// Migrates old flat-shape recipes { ingredients[], steps[] } into the new
// component-based shape { components[] }. Safe to run on already-migrated data.
export function normalizeRecipe(recipe) {
  if (recipe.components && recipe.components.length > 0) {
    // Already new shape — normalize ingredients and migrate legacy yield string
    return {
      ...recipe,
      components: recipe.components.map(comp => {
        const hasNewYield = "yieldAmt" in comp || "yieldUnit" in comp;
        const yieldFields = hasNewYield ? {} : parseYield(comp.yield);
        return {
          ...comp,
          ...yieldFields,
          yield: undefined,   // drop legacy field
          ingredients: (comp.ingredients || []).map(normalizeIngredient),
          steps:       normalizeSteps(comp.steps),
        };
      }),
    };
  }

  // Legacy shape: wrap top-level ingredients + steps into a single component
  return {
    ...recipe,
    components: [
      {
        id:          genId("comp"),
        name:        "",
        yieldAmt:    "",
        yieldUnit:   "",
        ingredients: (recipe.ingredients || []).map(normalizeIngredient),
        steps:       normalizeSteps(recipe.steps),
        holding:     "",
        notes:       "",
      },
    ],
    // Remove legacy top-level fields so nothing reads stale data
    ingredients: undefined,
    steps:       undefined,
  };
}

// ── Shopping list aggregation ─────────────────────────────────────────────────
// Flattens all components' ingredients into a single list for the shopping list.
// Recipe-link ingredients are included as a named item ("1 recipe Pastry Cream Filling").
export function allIngredients(recipe) {
  return (recipe.components || []).flatMap(c => c.ingredients || []);
}

// ── Formatters ────────────────────────────────────────────────────────────────
export function formatAmount(amount, multiplier = 1) {
  const val = amount * multiplier;
  if (val === 0) return "0";
  const rounded = Math.round(val * 100) / 100;
  if (rounded % 1 === 0) return String(rounded);
  const fractions = [
    [1 / 8, "⅛"], [1 / 4, "¼"], [1 / 3, "⅓"], [3 / 8, "⅜"],
    [1 / 2, "½"], [5 / 8, "⅝"], [2 / 3, "⅔"], [3 / 4, "¾"], [7 / 8, "⅞"],
  ];
  const whole = Math.floor(rounded);
  const frac  = rounded - whole;
  for (const [dec, glyph] of fractions) {
    if (Math.abs(frac - dec) < 0.04) {
      return whole > 0 ? `${whole}${glyph}` : glyph;
    }
  }
  return rounded.toFixed(1).replace(/\.0$/, "");
}

export function formatIngredient(ing, multiplier = 1) {
  if (ing.type === "recipe") {
    const amt = formatAmount(ing.amount, multiplier);
    return `${amt} recipe ${ing.recipeName}`;
  }
  const amt = formatAmount(ing.amount, multiplier);
  if (ing.unit === "pinch")              return `pinch of ${ing.name}`;
  if (!ing.unit || ing.unit === "whole") return `${amt} ${ing.name}`;
  return `${amt} ${ing.unit} ${ing.name}`;
}

export function formatTime(prepTime, cookTime) {
  const total = (prepTime || 0) + (cookTime || 0);
  if (!total) return "—";
  if (total < 60) return `${total}m`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
