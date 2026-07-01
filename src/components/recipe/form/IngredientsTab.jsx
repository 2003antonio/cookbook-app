import { Field } from "../../ui/Field";
import { UNITS } from "../../../models/recipe";
import { PartSelector } from "./PartSelector";

// ── Ingredients tab ───────────────────────────────────────────────────────────
// Scoped to `activePart` — for multi-part recipes, PartSelector lets the user
// switch which part's ingredient list they're editing.
export function IngredientsTab({
  multiPart, parts, activePart, activePartIdx, onSelectPart,
  activeIngredients, setIng, addIng, removeIng,
  inputStyle,
}) {
  return (
    <Field label={multiPart ? `Ingredients — ${activePart?.name || `Part ${activePartIdx + 1}`}` : "Ingredients"} style={{ flex: 1 }}>
      {multiPart && <PartSelector parts={parts} activePartIdx={activePartIdx} onSelect={onSelectPart} />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        {activeIngredients.map(ing => {
          const canRemove = activeIngredients.length > 1;
          return (
            <div key={ing.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                style={{ ...inputStyle(), width: 64 }} type="text" inputMode="decimal"
                value={ing.amount} onChange={e => setIng(ing.id, "amount", e.target.value)} placeholder="1"
              />
              <select style={{ ...inputStyle(), width: 80, cursor: "pointer" }} value={ing.unit} onChange={e => setIng(ing.id, "unit", e.target.value)}>
                {UNITS.filter(u => u.value !== "recipe").map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
              <input style={{ ...inputStyle(), flex: 1 }} value={ing.name || ing.recipeName || ""} onChange={e => setIng(ing.id, "name", e.target.value)} placeholder="ingredient" />
              <button onClick={() => removeIng(ing.id)} disabled={!canRemove}
                style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface)", color: "var(--ink-soft)", fontSize: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: canRemove ? 1 : 0.3 }}>✕</button>
            </div>
          );
        })}
        <button onClick={addIng} style={{ fontSize: 13, fontWeight: 500, color: "var(--fire)", padding: "4px 0", textAlign: "left", marginTop: "auto" }}>+ Add ingredient</button>
      </div>
    </Field>
  );
}
