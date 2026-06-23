// ── Recipe Model ──────────────────────────────────────────────────────────────
// Single source of truth for what a recipe is:
//   - Available field options (units, categories, colors)
//   - Default/blank values
//   - Factory functions for ingredients, steps, substeps
//   - Formatting helpers
//   - Step normalization (handles legacy string steps)
//
// When adding new recipe fields, start here.

// ── Field options ─────────────────────────────────────────────────────────────
export const UNITS = [
  { value: "quart", label: "quart" },
  { value: "cup",   label: "cup"   },
  { value: "tbsp",  label: "tbsp"  },
  { value: "tsp",   label: "tsp"   },
  { value: "oz",    label: "oz"    },
  { value: "lb",    label: "lb"    },
  { value: "g",     label: "g"     },
  { value: "kg",    label: "kg"    },
  { value: "ml",    label: "ml"    },
  { value: "l",     label: "l"     },
  { value: "whole", label: "whole" },
  { value: "pinch", label: "pinch" },
  { value: "",      label: "none"  },
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
  "#F5C842", "#355fe9", "#e71f1f", "#299932", "#ff830e",
  "#eb09b2", "#875504", "#000000", "#ac02db", "#00f5ab",
];

// ── Default blank recipe (used by RecipeForm for new recipes) ─────────────────
export const BLANK_RECIPE = {
  name:         "",
  category:     "Main Dish",
  prepTime:     "",
  cookTime:     "",
  baseServings: 4,
  color:        CARD_COLORS[0],
  rating:       0,
  tags:         [],
  notes:        "",
  ingredients:  null, // populated lazily in RecipeForm to avoid stale refs
  steps:        null,
};

// ── ID generator (client-side only, never stored as-is) ──────────────────────
function genId(prefix) {
  return `${prefix}${Date.now()}${Math.random()}`;
}

// ── Factory functions ─────────────────────────────────────────────────────────
export function newIngredient() {
  return { id: genId("i"), amount: "", unit: "cup", name: "" };
}

// Steps support sub-parts: Step 1, 1a, 1b … Step 2, 2a …
// Shape: { id, text, substeps: [{ id, text }] }
export function newStep() {
  return { id: genId("step"), text: "", substeps: [] };
}

export function newSubstep() {
  return { id: genId("sub"), text: "" };
}

// a, b, c … z, then s27, s28 … as a safety fallback
export function subLetter(idx) {
  return idx < 26 ? String.fromCharCode(97 + idx) : `s${idx + 1}`;
}

// ── Step normalization ────────────────────────────────────────────────────────
// Accepts legacy flat-string steps OR the current { id, text, substeps } shape.
// Always returns the latter with ids filled in — so RecipeForm can edit any
// previously-saved recipe without conditional checks.
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
  const amt = formatAmount(ing.amount, multiplier);
  if (ing.unit === "pinch")                  return `pinch of ${ing.name}`;
  if (!ing.unit || ing.unit === "whole")     return `${amt} ${ing.name}`;
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
