import { useState } from "react";
import { StarRating } from "../ui/StarRating";
import { Field }      from "../ui/Field";
import { showToast }  from "../ui/ToastHost";
import {
  UNITS, CATEGORY_OPTIONS, CARD_COLORS,
  newIngredient, newStep, newSubstep, subLetter, normalizeSteps,
} from "../../models/recipe";

// ── Amount parser (supports fractions and decimals) ───────────────────────────
function parseAmount(val) {
  if (val === "" || val == null) return 0;
  const str = String(val).trim();
  const mixed = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  const frac  = str.match(/^(\d+)\/(\d+)$/);
  if (frac)  return parseInt(frac[1]) / parseInt(frac[2]);
  return parseFloat(str) || 0;
}

const FORM_TABS = ["details", "ingredients", "steps", "notes"];

const BLANK = {
  name: "", category: "Main Dish", prepTime: "", cookTime: "",
  baseServings: 4, color: CARD_COLORS[0], rating: 0,
  tags: [], notes: "",
  ingredients: [newIngredient(), newIngredient(), newIngredient(), newIngredient()],
  steps: [newStep(), newStep(), newStep()],
};

export function RecipeForm({ initial, onSave, onCancel }) {
  let _mouseDownOnBackdrop = false;

  const [form,     setForm]     = useState(() =>
    initial
      ? { ...initial, tags: initial.tags || [], steps: normalizeSteps(initial.steps), ingredients: initial.ingredients?.length ? initial.ingredients : [newIngredient()] }
      : BLANK
  );
  const [activeTab, setActiveTab] = useState("details");
  const [tagInput,  setTagInput]  = useState("");
  const [errors,    setErrors]    = useState({});

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const set    = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setIng = (id, k, v) => set("ingredients", form.ingredients.map(i => i.id === id ? { ...i, [k]: v } : i));
  const addIng    = ()     => set("ingredients", [...form.ingredients, newIngredient()]);
  const removeIng = (id)   => set("ingredients", form.ingredients.filter(i => i.id !== id));

  const setStepText  = (stepId, val)         => set("steps", form.steps.map(s => s.id === stepId ? { ...s, text: val } : s));
  const addStep      = ()                    => set("steps", [...form.steps, newStep()]);
  const removeStep   = (stepId)              => set("steps", form.steps.filter(s => s.id !== stepId));
  const addSubstep   = (stepId)              => set("steps", form.steps.map(s => s.id === stepId ? { ...s, substeps: [...s.substeps, newSubstep()] } : s));
  const setSubstepText = (stepId, subId, v)  => set("steps", form.steps.map(s => s.id === stepId ? { ...s, substeps: s.substeps.map(sub => sub.id === subId ? { ...sub, text: v } : sub) } : s));
  const removeSubstep  = (stepId, subId)     => set("steps", form.steps.map(s => s.id === stepId ? { ...s, substeps: s.substeps.filter(sub => sub.id !== subId) } : s));

  const addTag    = () => { const t = tagInput.trim(); if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]); setTagInput(""); };
  const removeTag = t  => set("tags", form.tags.filter(x => x !== t));

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const e = {};
    if (!form.name.trim()) { e.name = "Name is required"; setActiveTab("details"); }
    if (Object.keys(e).length) { setErrors(e); return; }

    const cleanSteps = form.steps
      .map(s => ({
        id: s.id,
        text: s.text.trim(),
        substeps: s.substeps.map(sub => ({ id: sub.id, text: sub.text.trim() })).filter(sub => sub.text),
      }))
      .filter(s => s.text || s.substeps.length > 0);

    const recipeName = form.name.trim();
    onSave({
      ...form,
      prepTime:     Number(form.prepTime)     || 0,
      cookTime:     Number(form.cookTime)     || 0,
      baseServings: Number(form.baseServings) || 4,
      ingredients:  form.ingredients.filter(i => i.name.trim()).map(i => ({ ...i, amount: parseAmount(i.amount) })),
      steps:        cleanSteps,
    });
    showToast(`"${recipeName}" successfully ${initial ? "saved" : "created"}`);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const inputStyle = (err) => ({
    padding: "9px 12px",
    border: `1.5px solid ${err ? "#ef4444" : "var(--border)"}`,
    borderRadius: "var(--r-sm)", fontSize: 14, color: "var(--ink)",
    background: "white", outline: "none", width: "100%", transition: "border-color 0.15s",
  });

  // ── Tab badge counts ────────────────────────────────────────────────────────
  const ingCount     = form.ingredients.filter(i => i.name.trim()).length;
  const stepCount    = form.steps.reduce((acc, s) => acc + (s.text.trim() ? 1 : 0) + s.substeps.filter(sub => sub.text.trim()).length, 0);
  const noteLineCount = form.notes.split("\n").filter(l => l.trim()).length;

  const tabLabel = tab => {
    if (tab === "ingredients" && ingCount > 0)    return `Ingredients (${ingCount})`;
    if (tab === "steps"       && stepCount > 0)   return `Steps (${stepCount})`;
    if (tab === "notes"       && noteLineCount > 0) return `Notes (${noteLineCount})`;
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  const currentTabIdx = FORM_TABS.indexOf(activeTab);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(3px)", zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onMouseDown={e => { _mouseDownOnBackdrop = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && _mouseDownOnBackdrop) onCancel(); }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "white", borderRadius: "var(--r-lg)", width: "100%",
          maxWidth: 620, maxHeight: "90vh", display: "flex", flexDirection: "column",
          boxShadow: "var(--shadow-lg)", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 0", borderTop: `4px solid ${form.color}`, flexShrink: 0,
        }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>
            {initial ? "Edit Recipe" : "New Recipe"}
          </h2>
          <button onClick={onCancel} style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--surface)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 24px", gap: 4, flexShrink: 0, overflowX: "auto" }}>
          {FORM_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "12px 10px", fontSize: 13, fontWeight: 500,
              color: activeTab === tab ? "var(--fire)" : (tab === "details" && errors.name ? "#ef4444" : "var(--ink-soft)"),
              borderBottom: activeTab === tab ? "2px solid var(--fire)" : "2px solid transparent",
              marginBottom: -1, whiteSpace: "nowrap", transition: "color 0.15s",
            }}>
              {tabLabel(tab)}
              {tab === "details" && errors.name && <span style={{ marginLeft: 4, fontSize: 11 }}>⚠</span>}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>

          {/* ── Details ── */}
          {activeTab === "details" && (
            <>
              <Field label="Recipe name *">
                <input
                  style={inputStyle(errors.name)} value={form.name}
                  onChange={e => { set("name", e.target.value); if (errors.name) setErrors({}); }}
                  placeholder="e.g. Grandma's Apple Pie"
                />
                {errors.name && <span style={{ fontSize: 11.5, color: "#ef4444" }}>{errors.name}</span>}
              </Field>

              <div style={{ display: "flex", gap: 12 }}>
                <Field label="Category" style={{ flex: 1 }}>
                  <select style={{ ...inputStyle(), cursor: "pointer" }} value={form.category} onChange={e => set("category", e.target.value)}>
                    {CATEGORY_OPTIONS.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
                  </select>
                </Field>
                <Field label="Card color">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingTop: 4 }}>
                    {CARD_COLORS.map(c => (
                      <button key={c} onClick={() => set("color", c)} style={{
                        width: 22, height: 22, borderRadius: "50%", background: c,
                        border: form.color === c ? "2px solid var(--ink)" : "2px solid transparent",
                        boxShadow: form.color === c ? "0 0 0 2px white inset" : "none",
                        transition: "transform 0.12s", cursor: "pointer",
                      }}
                        onMouseEnter={e => e.target.style.transform = "scale(1.2)"}
                        onMouseLeave={e => e.target.style.transform = "scale(1)"}
                      />
                    ))}
                  </div>
                </Field>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { label: "Prep (min)", key: "prepTime",     ph: "15" },
                  { label: "Cook (min)", key: "cookTime",     ph: "30" },
                  { label: "Servings",  key: "baseServings",  ph: "4"  },
                ].map(f => (
                  <Field key={f.key} label={f.label} style={{ flex: 1 }}>
                    <input style={inputStyle()} type="number" min="0" value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.ph} />
                  </Field>
                ))}
              </div>

              <Field label="Rating">
                <StarRating rating={form.rating} interactive onChange={r => set("rating", r)} />
              </Field>

              <Field label="Tags">
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    style={{ ...inputStyle(), flex: 1 }} value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addTag()}
                    placeholder="e.g. Italian, Quick…"
                  />
                  <button onClick={addTag} style={{ padding: "9px 16px", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)", fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap" }}>Add</button>
                </div>
                {form.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {form.tags.map(t => (
                      <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 10px", background: "var(--fire-dim)", color: "var(--fire)", borderRadius: 999, fontSize: 12.5, fontWeight: 500 }}>
                        {t}
                        <button onClick={() => removeTag(t)} style={{ fontSize: 10, color: "var(--fire)", opacity: 0.6 }}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>
            </>
          )}

          {/* ── Ingredients ── */}
          {activeTab === "ingredients" && (
            <Field label="Ingredients">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {form.ingredients.map(ing => (
                  <div key={ing.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      style={{ ...inputStyle(), width: 64 }} type="text" inputMode="decimal"
                      value={ing.amount} onChange={e => setIng(ing.id, "amount", e.target.value)} placeholder="1"
                    />
                    <select style={{ ...inputStyle(), width: 80, cursor: "pointer" }} value={ing.unit} onChange={e => setIng(ing.id, "unit", e.target.value)}>
                      {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                    <input style={{ ...inputStyle(), flex: 1 }} value={ing.name} onChange={e => setIng(ing.id, "name", e.target.value)} placeholder="ingredient" />
                    <button onClick={() => removeIng(ing.id)} disabled={form.ingredients.length === 1}
                      style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface)", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", opacity: form.ingredients.length === 1 ? 0.3 : 1 }}>✕</button>
                  </div>
                ))}
                <button onClick={addIng} style={{ fontSize: 13, color: "var(--fire)", fontWeight: 500, textAlign: "left", padding: "4px 0" }}>+ Add ingredient</button>
              </div>
            </Field>
          )}

          {/* ── Steps ── */}
          {activeTab === "steps" && (
            <Field label="Steps">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {form.steps.map((step, idx) => (
                  <div key={step.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: "50%", background: "var(--fire-dim)",
                        color: "var(--fire)", fontSize: 12, fontWeight: 700, marginTop: 8, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{idx + 1}</span>
                      <textarea
                        style={{ ...inputStyle(), resize: "vertical", lineHeight: 1.5, flex: 1 }}
                        value={step.text} onChange={e => setStepText(step.id, e.target.value)}
                        placeholder={`Step ${idx + 1}…`} rows={2}
                      />
                      <button onClick={() => removeStep(step.id)} disabled={form.steps.length === 1}
                        style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface)", fontSize: 11, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", opacity: form.steps.length === 1 ? 0.3 : 1 }}>✕</button>
                    </div>

                    {step.substeps.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 12, paddingLeft: 16, borderLeft: "2px solid var(--border)" }}>
                        {step.substeps.map((sub, subIdx) => (
                          <div key={sub.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <span style={{
                              width: 22, height: 22, borderRadius: "50%", background: "white",
                              border: "1.5px solid var(--fire-dim)", color: "var(--fire)",
                              fontSize: 11, fontWeight: 700, marginTop: 7, flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>{subLetter(subIdx)}</span>
                            <textarea
                              style={{ ...inputStyle(), resize: "vertical", lineHeight: 1.5, flex: 1 }}
                              value={sub.text} onChange={e => setSubstepText(step.id, sub.id, e.target.value)}
                              placeholder={`Step ${idx + 1}${subLetter(subIdx)}…`} rows={1}
                            />
                            <button onClick={() => removeSubstep(step.id, sub.id)}
                              style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--surface)", fontSize: 10, marginTop: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button onClick={() => addSubstep(step.id)} style={{ fontSize: 12.5, color: "var(--ink-faint)", fontWeight: 500, textAlign: "left", marginLeft: 32, padding: "2px 0" }}>
                      + Add part ({step.substeps.length === 0 ? "a" : subLetter(step.substeps.length)})
                    </button>
                  </div>
                ))}
                <button onClick={addStep} style={{ fontSize: 13, color: "var(--fire)", fontWeight: 500, textAlign: "left", padding: "4px 0" }}>+ Add step</button>
              </div>
            </Field>
          )}

          {/* ── Notes ── */}
          {activeTab === "notes" && (
            <Field label="Notes & tips">
              <p style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 4 }}>
                Each line will appear as a separate note. Press Enter to start a new one.
              </p>
              <textarea
                style={{ ...inputStyle(), resize: "vertical", lineHeight: 1.7, minHeight: 180 }}
                value={form.notes} onChange={e => set("notes", e.target.value)}
                placeholder={"Tip 1: use ripe bananas\nTip 2: can substitute oat milk\nKeep refrigerated for up to 3 days"}
                rows={8}
              />
              {form.notes.split("\n").filter(l => l.trim()).length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 11.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-faint)", marginBottom: 8 }}>Preview</p>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {form.notes.split("\n").filter(l => l.trim()).map((line, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5 }}>
                        <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: "50%", background: "var(--fire)", flexShrink: 0 }} />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Field>
          )}
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ borderBottom: "1px solid var(--border)", padding: "10px 24px", display: "flex", justifyContent: "center", gap: 8, background: "white" }}>
            {currentTabIdx > 0 && (
              <button onClick={() => setActiveTab(FORM_TABS[currentTabIdx - 1])} style={{ padding: "7px 18px", background: "white", color: "var(--ink-soft)", borderRadius: "var(--r-full)", fontSize: 13, fontWeight: 500, border: "1.5px solid var(--border)" }}>← Back</button>
            )}
            {currentTabIdx < FORM_TABS.length - 1 && (
              <button onClick={() => setActiveTab(FORM_TABS[currentTabIdx + 1])} style={{ padding: "7px 18px", background: "white", color: "var(--ink-soft)", borderRadius: "var(--r-full)", fontSize: 13, fontWeight: 500, border: "1.5px solid var(--border)" }}>Next →</button>
            )}
            {currentTabIdx === 0 && currentTabIdx === FORM_TABS.length - 1 && <span style={{ height: 34 }} />}
          </div>
          <div style={{ padding: "16px 24px", display: "flex", justifyContent: "center" }}>
            <button onClick={handleSave} style={{ padding: "11px 40px", background: "var(--fire)", color: "white", borderRadius: "var(--r-full)", fontSize: 14, fontWeight: 600, boxShadow: "var(--shadow-sm)" }}>
              {initial ? "Save changes" : "Add recipe"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
