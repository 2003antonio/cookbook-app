// ── Recipe ↔ Supabase row mapping ─────────────────────────────────────────────
// Keeps all DB column names in one place. If you rename a column in Supabase,
// update RECIPE_FIELD_MAP here — nothing else needs to change.
//
// recipeToRow  — app object  → DB row  (for insert / update)
// rowToRecipe  — DB row      → app object  (migrates legacy flat shape)
//
// SUPABASE SCHEMA NOTE
// ────────────────────
// The recipes table needs a `components` jsonb column.
// Legacy rows may still have top-level `ingredients` and `steps` columns —
// rowToRecipe handles the migration automatically (wraps them into a single
// component) so old and new rows coexist without a destructive migration.
//
// Recommended migration SQL (run once, non-destructive):
//   ALTER TABLE recipes ADD COLUMN IF NOT EXISTS components jsonb;

import { normalizeRecipe } from "../models/recipe";

const RECIPE_FIELD_MAP = {
  name:         "name",
  category:     "category",
  prepTime:     "prep_time",
  cookTime:     "cook_time",
  baseServings: "base_servings",
  color:        "color",
  rating:       "rating",
  tags:         "tags",
  favorite:     "favorite",
  notes:        "notes",
  components:   "components",  // replaces top-level ingredients + steps
};

// Partial-update safe: only keys present on `recipe` are included in the row.
export function recipeToRow(recipe) {
  const row = {};
  for (const [jsKey, dbKey] of Object.entries(RECIPE_FIELD_MAP)) {
    if (recipe[jsKey] !== undefined) row[dbKey] = recipe[jsKey];
  }
  return row;
}

export function rowToRecipe(row) {
  const raw = {
    id:           row.id,
    name:         row.name,
    category:     row.category,
    prepTime:     row.prep_time,
    cookTime:     row.cook_time,
    baseServings: row.base_servings,
    color:        row.color,
    rating:       row.rating,
    tags:         row.tags || [],
    favorite:     row.favorite,
    notes:        row.notes,
    // New shape
    components:   row.components || null,
    // Legacy fields — present on old rows, undefined on new ones
    ingredients:  row.ingredients || null,
    steps:        row.steps || null,
    createdAt:    row.created_at ? Date.parse(row.created_at) : Date.now(),
    updatedAt:    row.updated_at ? Date.parse(row.updated_at) : undefined,
  };

  // normalizeRecipe handles both: if components[] exists it passes through,
  // if only ingredients/steps exist it wraps them into a single component.
  return normalizeRecipe(raw);
}

