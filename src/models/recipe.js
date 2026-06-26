// ── Recipe Model ──────────────────────────────────────────────────────────────
// Single source of truth for what a recipe is.
//
// SHAPE OVERVIEW
// ──────────────
// A recipe is made of one or more Parts. Each part is a section / stage of the
// dish with its own ingredients and steps. A simple recipe has exactly one part
// (its name/description left blank — the part IS the dish). A multi-part recipe
// breaks the dish into stages: "Prep", "The Sauce", "The Filling", "Assemble"…
//
//   Recipe
//     ├── metadata (name, category, color, rating, tags, notes…)
//     └── parts[]
//           ├── { id, name, description, icon }
//           ├── ingredients[] — { type:"ingredient", id, amount, unit, name }
//           └── steps[]       — { id, text, substeps:[{ id, text }] }
//
// LEGACY NOTE
// ───────────
// Older data used a `components` array (with yield/holding fields) or a flat
// top-level `ingredients`/`steps` pair. normalizeRecipe() migrates both into the
// `parts` shape, so old and new rows coexist without a destructive migration.
// (The Supabase column is still named `components` — see recipeService.js.)
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
  { value: "recipe", label: "recipe" }, // legacy recipe-link ingredients (display only)
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

// Emoji choices for a part's "visual cue" (Prep, Cook, Assemble, Finish…).
export const PART_ICONS = [
  "🥣", "🔪", "🍳", "🍲", "🥘", "🔥", "🧊", "🥗", "🫕", "🍰", "🍯", "🧂",
];

// ── ID generator (client-side only, never parsed or displayed) ────────────────
function genId(prefix) {
  return `${prefix}${Date.now()}${Math.random()}`;
}

// ── Ingredient factory ────────────────────────────────────────────────────────
export function newIngredient() {
  return { id: genId("i"), type: "ingredient", amount: "", unit: "cup", name: "" };
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

// ── Part factory ──────────────────────────────────────────────────────────────
// A part is a named section/stage of the recipe. For a simple recipe the name is
// blank — the part IS the dish. For multi-part dishes each part is distinct:
// "The Sauce", "The Filling", "Assemble & Serve", etc.
export function newPart(name = "") {
  return {
    id:          genId("part"),
    name,
    description: "",   // one-line summary shown under the part name
    icon:        "",   // optional emoji visual cue
    ingredients: [newIngredient()],
    steps:       [newStep()],
  };
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

// ── Part normalization ────────────────────────────────────────────────────────
// Migrates a legacy component ({ name, yield, holding, notes, ingredients, steps })
// into the lean part shape, dropping fields the parts model no longer uses.
function normalizePart(p) {
  return {
    id:          p.id || genId("part"),
    name:        p.name || "",
    description: p.description || "",
    icon:        p.icon || "",
    ingredients: (p.ingredients || []).map(normalizeIngredient),
    steps:       normalizeSteps(p.steps),
  };
}

// ── Recipe normalization ──────────────────────────────────────────────────────
// Migrates any historical shape into the current `parts` shape. Idempotent and
// safe to run repeatedly. Accepts:
//   • new shape    — { parts:[…] }
//   • component era — { components:[…] }
//   • flat legacy   — { ingredients:[…], steps:[…] }
export function normalizeRecipe(recipe) {
  const rawParts = recipe.parts?.length ? recipe.parts
    : recipe.components?.length ? recipe.components
    : null;

  if (rawParts) {
    return {
      ...recipe,
      components: undefined,           // drop legacy alias
      ingredients: undefined,
      steps: undefined,
      parts: rawParts.map(normalizePart),
    };
  }

  // Flat legacy shape: wrap top-level ingredients + steps into a single part.
  return {
    ...recipe,
    components: undefined,
    ingredients: undefined,
    steps: undefined,
    parts: [normalizePart({
      ingredients: recipe.ingredients,
      steps:       recipe.steps,
    })],
  };
}

// ── Shopping list aggregation ─────────────────────────────────────────────────
// Flattens every part's ingredients into a single list for the shopping list.
// Tolerant of un-normalized recipes (reads parts, then legacy components).
export function allIngredients(recipe) {
  const parts = recipe.parts || recipe.components || [];
  return parts.flatMap(p => p.ingredients || []);
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
