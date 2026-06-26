// ── Recipe ↔ Supabase row mapping ─────────────────────────────────────────────
// Keeps all DB column names in one place. If you rename a column in Supabase,
// update RECIPE_FIELD_MAP here — nothing else needs to change.
//
// recipeToRow  — app object  → DB row  (for insert / update)
// rowToRecipe  — DB row      → app object  (migrates legacy flat shape)
//
// SUPABASE SCHEMA NOTE
// ────────────────────
// The recipes table stores the part list in a jsonb column still named
// `components` (kept to avoid a destructive rename). In the app this maps to the
// `parts` field — recipeToRow writes parts → components, rowToRecipe reads
// components → parts via normalizeRecipe. Legacy rows with top-level
// `ingredients`/`steps` are migrated automatically too.
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
  parts:        "components",  // app `parts` ↔ DB `components` jsonb column
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
    // Part list lives in the `components` jsonb column (see schema note above).
    parts:        row.components || null,
    // Legacy flat fields — present on very old rows, undefined otherwise
    ingredients:  row.ingredients || null,
    steps:        row.steps || null,
    createdAt:    row.created_at ? Date.parse(row.created_at) : Date.now(),
    updatedAt:    row.updated_at ? Date.parse(row.updated_at) : undefined,
  };

  // normalizeRecipe migrates any shape (parts / components / flat) into `parts`.
  return normalizeRecipe(raw);
}

