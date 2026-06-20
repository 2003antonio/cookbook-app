import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "mise_en_place_v2";

const SEED_RECIPES = [
  {
    id: "1", name: "Lemon Tart", category: "Dessert",
    prepTime: 60, cookTime: 30, baseServings: 8,
    color: "#F5C842", rating: 5, tags: ["French", "Citrus"], favorite: true,
    notes: "Chill the tart shell before filling for the crispest result.",
    ingredients: [
      { id: "i1", amount: 1.5, unit: "cup", name: "all-purpose flour" },
      { id: "i2", amount: 0.5, unit: "cup", name: "icing sugar" },
      { id: "i3", amount: 0.67, unit: "cup", name: "softened butter" },
      { id: "i4", amount: 1, unit: "pinch", name: "salt" },
      { id: "i5", amount: 1, unit: "whole", name: "egg yolk" },
      { id: "i6", amount: 6, unit: "whole", name: "lemons, zested & juiced" },
      { id: "i7", amount: 6, unit: "whole", name: "large eggs" },
      { id: "i8", amount: 1.5, unit: "cup", name: "caster sugar" },
    ],
    steps: [
      "Mix flour, icing sugar, and salt. Cut in butter until crumbly.",
      "Add egg yolk and press into tart pan. Chill 30 min.",
      "Blind bake at 375°F for 15 min.",
      "Whisk lemon juice, eggs, and sugar. Pour into shell.",
      "Bake 25–30 min until just set. Cool before serving.",
    ],
    createdAt: Date.now() - 5000,
  },
  {
    id: "2", name: "Victoria Sponge", category: "Baking",
    prepTime: 20, cookTime: 25, baseServings: 10,
    color: "#E8A87C", rating: 5, tags: ["British", "Classic"], favorite: true,
    notes: "Room temperature butter is key — take it out an hour early.",
    ingredients: [
      { id: "i1", amount: 2, unit: "cup", name: "self-rising flour" },
      { id: "i2", amount: 1, unit: "cup", name: "unsalted butter" },
      { id: "i3", amount: 1, unit: "cup", name: "caster sugar" },
      { id: "i4", amount: 4, unit: "whole", name: "large eggs" },
      { id: "i5", amount: 2, unit: "tsp", name: "vanilla extract" },
      { id: "i6", amount: 0.5, unit: "cup", name: "strawberry jam" },
      { id: "i7", amount: 1, unit: "cup", name: "heavy cream, whipped" },
    ],
    steps: [
      "Cream butter and sugar until pale and fluffy.",
      "Beat in eggs one at a time with vanilla.",
      "Fold in flour gently. Divide between two 8-inch pans.",
      "Bake at 350°F for 25 min. Cool completely.",
      "Sandwich with jam and whipped cream.",
    ],
    createdAt: Date.now() - 4000,
  },
  {
    id: "3", name: "Quiche Lorraine", category: "Main Dish",
    prepTime: 20, cookTime: 40, baseServings: 6,
    color: "#C4956A", rating: 4, tags: ["French", "Savory"], favorite: false,
    notes: "Don't over-bake — the center should still have a slight wobble.",
    ingredients: [
      { id: "i1", amount: 1, unit: "whole", name: "pie crust, pre-baked" },
      { id: "i2", amount: 6, unit: "whole", name: "slices bacon, crumbled" },
      { id: "i3", amount: 1.5, unit: "cup", name: "Gruyère, grated" },
      { id: "i4", amount: 4, unit: "whole", name: "large eggs" },
      { id: "i5", amount: 1.5, unit: "cup", name: "heavy cream" },
      { id: "i6", amount: 0.25, unit: "tsp", name: "nutmeg" },
      { id: "i7", amount: 1, unit: "pinch", name: "salt & pepper" },
    ],
    steps: [
      "Scatter bacon and cheese over the pre-baked crust.",
      "Whisk eggs, cream, nutmeg, salt, and pepper.",
      "Pour custard over the filling.",
      "Bake at 375°F for 35–40 min until set.",
      "Rest 10 min before slicing.",
    ],
    createdAt: Date.now() - 3000,
  },
  {
    id: "4", name: "Pancakes", category: "Breakfast",
    prepTime: 10, cookTime: 15, baseServings: 4,
    color: "#D4956A", rating: 5, tags: ["American", "Quick"], favorite: true,
    notes: "Let the batter rest 5 min before cooking — makes them fluffier.",
    ingredients: [
      { id: "i1", amount: 1.5, unit: "cup", name: "all-purpose flour" },
      { id: "i2", amount: 2, unit: "tbsp", name: "sugar" },
      { id: "i3", amount: 1, unit: "tsp", name: "baking powder" },
      { id: "i4", amount: 0.5, unit: "tsp", name: "baking soda" },
      { id: "i5", amount: 1, unit: "cup", name: "buttermilk" },
      { id: "i6", amount: 2, unit: "whole", name: "large eggs" },
      { id: "i7", amount: 3, unit: "tbsp", name: "melted butter" },
    ],
    steps: [
      "Whisk dry ingredients together.",
      "Mix wet ingredients separately.",
      "Combine gently — lumps are fine. Rest 5 min.",
      "Cook on a buttered griddle over medium heat.",
      "Flip when bubbles form. Serve with maple syrup.",
    ],
    createdAt: Date.now() - 2000,
  },
  {
    id: "5", name: "Choc Chip Cookies", category: "Baking",
    prepTime: 15, cookTime: 11, baseServings: 24,
    color: "#8B6047", rating: 5, tags: ["American", "Classic"], favorite: true,
    notes: "Chill the dough 30 min for thicker, chewier cookies.",
    ingredients: [
      { id: "i1", amount: 2.25, unit: "cup", name: "all-purpose flour" },
      { id: "i2", amount: 1, unit: "tsp", name: "baking soda" },
      { id: "i3", amount: 1, unit: "tsp", name: "salt" },
      { id: "i4", amount: 1, unit: "cup", name: "unsalted butter" },
      { id: "i5", amount: 0.75, unit: "cup", name: "granulated sugar" },
      { id: "i6", amount: 0.75, unit: "cup", name: "brown sugar" },
      { id: "i7", amount: 2, unit: "whole", name: "large eggs" },
      { id: "i8", amount: 2, unit: "cup", name: "chocolate chips" },
    ],
    steps: [
      "Cream butter and both sugars until fluffy.",
      "Beat in eggs. Mix in flour, baking soda, and salt.",
      "Fold in chocolate chips.",
      "Drop rounded tablespoons onto baking sheet.",
      "Bake at 375°F for 9–11 min until golden.",
    ],
    createdAt: Date.now() - 1000,
  },
  {
    id: "6", name: "Vegetable Kebabs", category: "Side Dish",
    prepTime: 15, cookTime: 12, baseServings: 4,
    color: "#6B9E5E", rating: 4, tags: ["Grilled", "Vegetarian"], favorite: false,
    notes: "Soak wooden skewers 30 min to prevent burning.",
    ingredients: [
      { id: "i1", amount: 1, unit: "whole", name: "zucchini, chunked" },
      { id: "i2", amount: 1, unit: "whole", name: "red bell pepper, chunked" },
      { id: "i3", amount: 1, unit: "whole", name: "yellow bell pepper, chunked" },
      { id: "i4", amount: 1, unit: "whole", name: "red onion, wedged" },
      { id: "i5", amount: 1, unit: "cup", name: "cherry tomatoes" },
      { id: "i6", amount: 3, unit: "tbsp", name: "olive oil" },
      { id: "i7", amount: 2, unit: "tsp", name: "Italian seasoning" },
      { id: "i8", amount: 1, unit: "pinch", name: "salt & pepper" },
    ],
    steps: [
      "Toss vegetables with oil, seasoning, salt, and pepper.",
      "Thread onto soaked wooden skewers.",
      "Grill over medium-high heat 10–12 min, turning.",
      "Serve with tzatziki or hummus.",
    ],
    createdAt: Date.now(),
  },
];

export const UNITS = [
  { value: "quart", label: "quart" },
  { value: "cup", label: "cup" },
  { value: "tbsp", label: "tbsp" },
  { value: "tsp", label: "tsp" },
  { value: "oz", label: "oz" },
  { value: "lb", label: "lb" },
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "l" },
  { value: "whole", label: "whole" },
  { value: "pinch", label: "pinch" },
  { value: "", label: "none" },
];

export const CATEGORY_OPTIONS = [
  { name: "Breakfast", emoji: "🍳" },
  { name: "Appetizer", emoji: "🥗" },
  { name: "Main Dish", emoji: "🍖" },
  { name: "Side Dish", emoji: "🍟" },
  { name: "Soup", emoji: "🍲" },
  { name: "Dessert", emoji: "🍰" },
  { name: "Beverage", emoji: "🍹" },
];

export const CARD_COLORS = [
  "#F5C842", "#355fe9", "#e71f1f", "#299932", "#ff830e",
  "#eb09b2", "#875504", "#000000", "#ac02db", "#00f5ab",
];

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
  const frac = rounded - whole;
  for (const [dec, glyph] of fractions) {
    if (Math.abs(frac - dec) < 0.04) {
      return whole > 0 ? `${whole}${glyph}` : glyph;
    }
  }
  return rounded.toFixed(1).replace(/\.0$/, "");
}

export function formatIngredient(ing, multiplier = 1) {
  const amt = formatAmount(ing.amount, multiplier);
  if (ing.unit === "pinch") return `pinch of ${ing.name}`;
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

// Unique-enough id for client-side list items (ingredients, steps, sub-steps).
// Only ever used as a React key / equality check — never parsed or displayed —
// so the exact format doesn't matter, just that it's unique per call.
function genId(prefix) {
  return `${prefix}${Date.now()}${Math.random()}`;
}

export function newIngredient() {
  return { id: genId("i"), amount: "", unit: "cup", name: "" };
}

// Steps support multiple parts: Step 1, 1a, 1b, 1c, Step 2, 2a, 2b …
// Shape: { id, text, substeps: [{ id, text }] }
export function newStep() {
  return { id: genId("step"), text: "", substeps: [] };
}

export function newSubstep() {
  return { id: genId("sub"), text: "" };
}

// a, b, c … z, then a safety fallback past 26 sub-steps
export function subLetter(idx) {
  return idx < 26 ? String.fromCharCode(97 + idx) : `s${idx + 1}`;
}

// Accepts legacy flat-string steps, legacy string sub-steps, or the current
// { id, text, substeps } shape — always returns the latter (ids filled in
// where missing) so the form can edit any previously-saved recipe.
export function normalizeSteps(steps) {
  if (!steps || !steps.length) return [newStep()];
  return steps.map(s => {
    if (typeof s === "string") return { id: genId("step"), text: s, substeps: [] };
    return {
      id: s.id || genId("step"),
      text: s.text || "",
      substeps: (s.substeps || []).map(sub =>
        typeof sub === "string"
          ? { id: genId("sub"), text: sub }
          : { id: sub.id || genId("sub"), text: sub.text || "" }
      ),
    };
  });
}

// Read-only flattening for display — tolerates the same legacy shapes.
export function stepsForDisplay(steps) {
  return (steps || [])
    .map(s => typeof s === "string"
      ? { text: s, substeps: [] }
      : { text: s.text || "", substeps: (s.substeps || []).map(sub => typeof sub === "string" ? sub : (sub.text || "")) })
    .filter(s => s.text || s.substeps.some(t => t));
}

export function useRecipes() {
  const [recipes, setRecipes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) return parsed;
      }
    } catch (e) { }
    return SEED_RECIPES;
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes)); } catch (e) { }
  }, [recipes]);

  const addRecipe = useCallback((recipe) => {
    const r = { ...recipe, id: String(Date.now()), createdAt: Date.now(), favorite: false };
    setRecipes(prev => [r, ...prev]);
    return r;
  }, []);

  const updateRecipe = useCallback((id, updates) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r));
  }, []);

  const deleteRecipe = useCallback((id) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
  }, []);

  const toggleFavorite = useCallback((id) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, favorite: !r.favorite } : r));
  }, []);

  return { recipes, addRecipe, updateRecipe, deleteRecipe, toggleFavorite };
}

// Shopping list hook
const SHOPPING_KEY = "mise_shopping_v2";

export function useShoppingList() {
  const [items, setItems] = useState(() => {
    try {
      const s = localStorage.getItem(SHOPPING_KEY);
      return s ? JSON.parse(s) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(SHOPPING_KEY, JSON.stringify(items)); } catch (e) { }
  }, [items]);

  const addItem = useCallback((text) => {
    if (!text.trim()) return;
    setItems(prev => [...prev, { id: Date.now(), text: text.trim(), checked: false }]);
  }, []);

  const toggleItem = useCallback((id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const clearChecked = useCallback(() => {
    setItems(prev => prev.filter(i => !i.checked));
  }, []);

  const addFromRecipe = useCallback((recipe) => {
    const newItems = recipe.ingredients
      .filter(ing => ing.name.trim())
      .map(ing => ({
        id: Date.now() + Math.random(),
        text: formatIngredient(ing),
        checked: false,
        fromRecipe: recipe.name,
      }));
    setItems(prev => [...prev, ...newItems]);
  }, []);

  return { items, addItem, toggleItem, removeItem, clearChecked, addFromRecipe };
}