import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

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

// ── Supabase row <-> app shape mapping ──────────────────────────────────────
// Only these fields are ever written to the `recipes` table. Building the
// row from this map (rather than spreading the whole object) means partial
// `updates` objects only touch the columns that actually changed — any key
// not present on the input is simply omitted (JSON.stringify drops
// `undefined` values), so a `{ favorite: true }` update never clobbers name,
// ingredients, etc. with null.
const RECIPE_FIELD_MAP = {
  name: "name",
  category: "category",
  prepTime: "prep_time",
  cookTime: "cook_time",
  baseServings: "base_servings",
  color: "color",
  rating: "rating",
  tags: "tags",
  favorite: "favorite",
  notes: "notes",
  ingredients: "ingredients",
  steps: "steps",
};

function recipeToRow(recipe) {
  const row = {};
  for (const [jsKey, dbKey] of Object.entries(RECIPE_FIELD_MAP)) {
    if (recipe[jsKey] !== undefined) row[dbKey] = recipe[jsKey];
  }
  return row;
}

function rowToRecipe(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    baseServings: row.base_servings,
    color: row.color,
    rating: row.rating,
    tags: row.tags || [],
    favorite: row.favorite,
    notes: row.notes,
    ingredients: row.ingredients || [],
    steps: row.steps || [],
    createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
    updatedAt: row.updated_at ? Date.parse(row.updated_at) : undefined,
  };
}

function rowToItem(row) {
  return {
    id: row.id,
    text: row.text,
    checked: row.checked,
    fromRecipe: row.from_recipe || undefined,
  };
}

export function useRecipes(userId) {
  const [recipes, setRecipes] = useState(SEED_RECIPES);
  const [loading, setLoading] = useState(false);

  // Reload from Supabase whenever the signed-in user changes.
  // Signed out -> back to the read-only demo set, nothing persisted.
  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setRecipes(SEED_RECIPES);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("recipes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error) {
          console.error("Failed to load recipes:", error.message);
          setRecipes([]);
          return;
        }
        setRecipes((data || []).map(rowToRecipe));
      });

    return () => { cancelled = true; };
  }, [userId]);

  // Local state always updates immediately (optimistic); the Supabase call
  // fires in the background and rolls back local state on failure. When
  // signed out, this is just in-memory demo editing — nothing to sync.
  const addRecipe = useCallback((recipe) => {
    const id = crypto.randomUUID();
    const r = { ...recipe, id, createdAt: Date.now(), favorite: false };
    setRecipes(prev => [r, ...prev]);

    if (userId) {
      supabase
        .from("recipes")
        .insert({ id, user_id: userId, ...recipeToRow(r) })
        .then(({ error }) => {
          if (error) {
            console.error("Failed to save recipe:", error.message);
            setRecipes(prev => prev.filter(x => x.id !== id));
          }
        });
    }

    return r;
  }, [userId]);

  const updateRecipe = useCallback((id, updates) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r));

    if (!userId) return;

    supabase
      .from("recipes")
      .update({ ...recipeToRow(updates), updated_at: new Date().toISOString() })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Failed to update recipe:", error.message);
      });
  }, [userId]);

  const deleteRecipe = useCallback((id) => {
    let removed;
    setRecipes(prev => {
      removed = prev.find(r => r.id === id);
      return prev.filter(r => r.id !== id);
    });

    if (!userId) return;

    supabase.from("recipes").delete().eq("id", id).then(({ error }) => {
      if (error) {
        console.error("Failed to delete recipe:", error.message);
        if (removed) setRecipes(prev => [removed, ...prev]);
      }
    });
  }, [userId]);

  const toggleFavorite = useCallback((id) => {
    let nextFavorite;
    setRecipes(prev => prev.map(r => {
      if (r.id !== id) return r;
      nextFavorite = !r.favorite;
      return { ...r, favorite: nextFavorite };
    }));

    if (!userId) return;

    supabase.from("recipes").update({ favorite: nextFavorite }).eq("id", id).then(({ error }) => {
      if (error) {
        console.error("Failed to update favorite:", error.message);
        setRecipes(prev => prev.map(r => r.id === id ? { ...r, favorite: !nextFavorite } : r));
      }
    });
  }, [userId]);

  return { recipes, addRecipe, updateRecipe, deleteRecipe, toggleFavorite, loading };
}

// Shopping list hook
export function useShoppingList(userId) {
  const [items, setItems] = useState([]);

  // Signed out -> empty list, nothing persisted.
  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setItems([]);
      return;
    }

    supabase
      .from("shopping_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load shopping list:", error.message);
          setItems([]);
          return;
        }
        setItems((data || []).map(rowToItem));
      });

    return () => { cancelled = true; };
  }, [userId]);

  const addItem = useCallback((text) => {
    if (!text.trim()) return;
    const id = crypto.randomUUID();
    const item = { id, text: text.trim(), checked: false };
    setItems(prev => [...prev, item]);

    if (!userId) return;

    supabase.from("shopping_items").insert({ id, user_id: userId, text: item.text, checked: false })
      .then(({ error }) => {
        if (error) {
          console.error("Failed to add shopping item:", error.message);
          setItems(prev => prev.filter(i => i.id !== id));
        }
      });
  }, [userId]);

  const toggleItem = useCallback((id) => {
    let nextChecked;
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      nextChecked = !i.checked;
      return { ...i, checked: nextChecked };
    }));

    if (!userId) return;

    supabase.from("shopping_items").update({ checked: nextChecked }).eq("id", id)
      .then(({ error }) => {
        if (error) {
          console.error("Failed to update shopping item:", error.message);
          setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !nextChecked } : i));
        }
      });
  }, [userId]);

  const removeItem = useCallback((id) => {
    let removed;
    setItems(prev => {
      removed = prev.find(i => i.id === id);
      return prev.filter(i => i.id !== id);
    });

    if (!userId) return;

    supabase.from("shopping_items").delete().eq("id", id)
      .then(({ error }) => {
        if (error) {
          console.error("Failed to remove shopping item:", error.message);
          if (removed) setItems(prev => [...prev, removed]);
        }
      });
  }, [userId]);

  const clearChecked = useCallback(() => {
    let removedIds = [];
    setItems(prev => {
      removedIds = prev.filter(i => i.checked).map(i => i.id);
      return prev.filter(i => !i.checked);
    });

    if (!userId || removedIds.length === 0) return;

    supabase.from("shopping_items").delete().in("id", removedIds)
      .then(({ error }) => {
        if (error) console.error("Failed to clear checked items:", error.message);
      });
  }, [userId]);

  const addFromRecipe = useCallback((recipe) => {
    const newItems = recipe.ingredients
      .filter(ing => ing.name.trim())
      .map(ing => ({
        id: crypto.randomUUID(),
        text: formatIngredient(ing),
        checked: false,
        fromRecipe: recipe.name,
      }));
    if (!newItems.length) return;

    setItems(prev => [...prev, ...newItems]);

    if (!userId) return;

    supabase.from("shopping_items").insert(
      newItems.map(i => ({ id: i.id, user_id: userId, text: i.text, checked: false, from_recipe: i.fromRecipe }))
    ).then(({ error }) => {
      if (error) {
        console.error("Failed to add ingredients to shopping list:", error.message);
        const ids = new Set(newItems.map(i => i.id));
        setItems(prev => prev.filter(i => !ids.has(i.id)));
      }
    });
  }, [userId]);

  return { items, addItem, toggleItem, removeItem, clearChecked, addFromRecipe };
}