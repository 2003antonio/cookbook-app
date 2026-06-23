// ── Recipe ↔ Supabase row mapping ─────────────────────────────────────────────
// Keeps all DB column names in one place. If you rename a column in Supabase,
// update RECIPE_FIELD_MAP here — nothing else needs to change.
//
// recipeToRow  — app object  → DB row  (for insert / update)
// rowToRecipe  — DB row      → app object
// rowToItem    — DB row      → shopping-list item

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
  ingredients:  "ingredients",
  steps:        "steps",
};

// Partial-update safe: only keys present on `recipe` are included in the row.
// A { favorite: true } patch won't clobber name, ingredients, etc. with null.
export function recipeToRow(recipe) {
  const row = {};
  for (const [jsKey, dbKey] of Object.entries(RECIPE_FIELD_MAP)) {
    if (recipe[jsKey] !== undefined) row[dbKey] = recipe[jsKey];
  }
  return row;
}

export function rowToRecipe(row) {
  return {
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
    ingredients:  row.ingredients || [],
    steps:        row.steps || [],
    createdAt:    row.created_at ? Date.parse(row.created_at) : Date.now(),
    updatedAt:    row.updated_at ? Date.parse(row.updated_at) : undefined,
  };
}

export function rowToItem(row) {
  return {
    id:         row.id,
    text:       row.text,
    checked:    row.checked,
    fromRecipe: row.from_recipe || undefined,
  };
}
