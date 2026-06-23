// ── Shopping list ↔ Supabase row mapping ──────────────────────────────────────
// rowToItem — DB row → shopping-list item

export function rowToItem(row) {
  return {
    id:         row.id,
    text:       row.text,
    checked:    row.checked,
    fromRecipe: row.from_recipe || undefined,
  };
}
