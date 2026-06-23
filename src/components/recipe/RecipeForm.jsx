import { useState, useRef, useEffect } from "react";
import { StarRating } from "../ui/StarRating";
import { Field }      from "../ui/Field";
import { showToast }  from "../ui/ToastHost";
import {
  UNITS, CATEGORY_OPTIONS, CARD_COLORS,
  newIngredient, newRecipeLink, newStep, newSubstep,
  subLetter, normalizeRecipe, newComponent,
} from "../../models/recipe";

// ── Amount parser (supports fractions and decimals) ───────────────────────────
function parseAmount(val) {
  if (val === "" || val == null) return 0;
  const str   = String(val).trim();
  const mixed = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  const frac  = str.match(/^(\d+)\/(\d+)$/);
  if (frac)  return parseInt(frac[1]) / parseInt(frac[2]);
  return parseFloat(str) || 0;
}

const FORM_TABS = ["details", "ingredients", "steps", "notes"];

function blankForm() {
  return {
    name: "", category: "Main Dish", prepTime: "", cookTime: "",
    baseServings: 4, color: CARD_COLORS[0], rating: 0,
    tags: [], notes: "",
    ingredients: [newIngredient()],
    steps: [newStep()],
    components: [newComponent()],
  };
}

// ── RecipeForm ────────────────────────────────────────────────────────────────
export function RecipeForm({ initial, onSave, onCancel, recipes = [] }) {
  let _mouseDownOnBackdrop = false;

  const [form, setForm] = useState(() => {
    if (!initial) return blankForm();
    const normalized = normalizeRecipe(initial);
    const comps = (normalized.components || []).map(c => ({
      ...c,
      ingredients: c.ingredients?.length ? c.ingredients : [newIngredient()],
      steps:       c.steps?.length       ? c.steps       : [newStep()],
    }));
    // Top-level ingredients/steps only matter in simple mode (0 components).
    // When components exist, keep defaults ready in case user removes all components.
    const hasComponents = comps.length > 0;
    return {
      ...normalized,
      tags:        normalized.tags || [],
      ingredients: hasComponents ? [newIngredient()] : (normalized.ingredients?.length ? normalized.ingredients : [newIngredient()]),
      steps:       hasComponents ? [newStep()]        : (normalized.steps?.length       ? normalized.steps       : [newStep()]),
      components:  comps,
    };
  });

  const isPrefillMode = !!initial?._prefill;
  const [activeTab,      setActiveTab]      = useState("details");
  const [activeCompIdx,  setActiveCompIdx]  = useState(0);
  const cancelPickingRef = useRef(null);
  const [tagInput,       setTagInput]       = useState("");
  const [errors,         setErrors]         = useState({});
  const [categoryOpen,   setCategoryOpen]   = useState(false);
  const categoryRef = useRef(null);
  const bodyRef   = useRef(null);
  const pickerRef = useRef(null);
  const scrollToBottom = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }));

  // ── Form-level setters ───────────────────────────────────────────────────────
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── Component setters ────────────────────────────────────────────────────────
  const updateComp = (compId, changes) =>
    set("components", form.components.map(c => c.id === compId ? { ...c, ...changes } : c));

  const addComponent = () => {
    const comp = newComponent();
    set("components", [...form.components, comp]);
    setActiveCompIdx(form.components.length);
    scrollToBottom();
  };

  const removeComponent = (compId) => {
    const next = form.components.filter(c => c.id !== compId);
    set("components", next);
    setActiveCompIdx(i => Math.min(i, Math.max(next.length - 1, 0)));
  };

  // ── Simple-mode (0 components) vs component-mode ────────────────────────────
  const simpleMode = form.components.length === 0;

  // ── Ingredient/step setters (scoped to active component) ─────────────────────
  const activeComp = form.components[activeCompIdx] ?? form.components[0];

  // Cancel any open recipe/component picker (removes the transient row)
  const cancelPicking = () =>
    setForm(f => {
      if (f.components.length === 0) {
        const pickingIng = f.ingredients.find(i => i._picking);
        if (!pickingIng) return f;
        return { ...f, ingredients: f.ingredients.filter(i => i.id !== pickingIng.id) };
      }
      const comp = f.components[activeCompIdx] ?? f.components[0];
      if (!comp) return f;
      const pickingIng = comp.ingredients.find(i => i._picking);
      if (!pickingIng) return f;
      return {
        ...f,
        components: f.components.map(c =>
          c.id === comp.id
            ? { ...c, ingredients: c.ingredients.filter(i => i.id !== pickingIng.id) }
            : c
        ),
      };
    });
  cancelPickingRef.current = cancelPicking;

  // Close picker on click-outside
  useEffect(() => {
    const hasPicker = activeIngredients.some(i => i._picking);
    if (!hasPicker) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target))
        cancelPickingRef.current();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  });

  // Wrappers that dismiss the picker before switching context
  const switchTab  = (tab) => { cancelPickingRef.current(); setActiveTab(tab); };
  const switchComp = (idx) => { cancelPickingRef.current(); setActiveCompIdx(idx); };

  // Close category dropdown on click-outside
  useEffect(() => {
    if (!categoryOpen) return;
    const handler = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) setCategoryOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [categoryOpen]);

  // ── Active ingredients/steps: top-level in simple mode, component-scoped otherwise ──
  const activeIngredients = simpleMode ? form.ingredients : activeComp?.ingredients ?? [];
  const activeSteps       = simpleMode ? form.steps       : activeComp?.steps       ?? [];

  const setIngList  = (ings)  => simpleMode ? set("ingredients", ings) : updateComp(activeComp.id, { ingredients: ings });
  const setStepList = (steps) => simpleMode ? set("steps", steps)       : updateComp(activeComp.id, { steps });

  const setIng = (ingId, k, v) =>
    setIngList(activeIngredients.map(i => i.id === ingId ? { ...i, [k]: v } : i));

  const addIng        = ()         => { cancelPickingRef.current(); setIngList([...activeIngredients, newIngredient()]); scrollToBottom(); };
  const addPickerRow  = ()         => { setIngList([...activeIngredients, { ...newRecipeLink(), _picking: true }]); scrollToBottom(); };
  const resolvePickerRow = (ingId, compName, recipe) => {
    setIngList(activeIngredients.map(i => i.id === ingId
      ? compName
        ? { ...i, recipeName: compName, recipeId: null, isCompRef: true, _picking: false }
        : { ...i, recipeName: recipe.name, recipeId: recipe.id, _picking: false }
      : i
    ));
  };
  const removeIng    = (id)       => setIngList(activeIngredients.filter(i => i.id !== id));

  const setStepText    = (stepId, val)       => setStepList(activeSteps.map(s => s.id === stepId ? { ...s, text: val } : s));
  const addStep        = ()                  => { setStepList([...activeSteps, newStep()]); scrollToBottom(); };
  const removeStep     = (stepId)            => setStepList(activeSteps.filter(s => s.id !== stepId));
  const addSubstep     = (stepId)            => { setStepList(activeSteps.map(s => s.id === stepId ? { ...s, substeps: [...s.substeps, newSubstep()] } : s)); scrollToBottom(); };
  const setSubstepText = (stepId, subId, v)  => setStepList(activeSteps.map(s => s.id === stepId ? { ...s, substeps: s.substeps.map(sub => sub.id === subId ? { ...sub, text: v } : sub) } : s));
  const removeSubstep  = (stepId, subId)     => setStepList(activeSteps.map(s => s.id === stepId ? { ...s, substeps: s.substeps.filter(sub => sub.id !== subId) } : s));

  // ── Tag setters ──────────────────────────────────────────────────────────────
  const addTag    = () => { const t = tagInput.trim(); if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]); setTagInput(""); };
  const removeTag = t  => set("tags", form.tags.filter(x => x !== t));

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const e = {};
    if (!form.name.trim()) { e.name = "Name is required"; setActiveTab("details"); }
    if (Object.keys(e).length) { setErrors(e); return; }

    const cleanIngredients = (ings) => ings
      .filter(i => i.type === "recipe" ? i.recipeName.trim() : i.name.trim())
      .map(i => i.type === "recipe" ? (({ isCompRef, ...rest }) => rest)(i) : { ...i, amount: parseAmount(i.amount) });
    const cleanSteps = (steps) => steps
      .map(s => ({
        id:       s.id,
        text:     s.text.trim(),
        substeps: s.substeps.map(sub => ({ id: sub.id, text: sub.text.trim() })).filter(sub => sub.text),
      }))
      .filter(s => s.text || s.substeps.length > 0);

    const cleanComponents = form.components.map(comp => ({
      ...comp,
      ingredients: cleanIngredients(comp.ingredients),
      steps:       cleanSteps(comp.steps),
    }));

    const recipeName = form.name.trim();
    const isSimpleMode = form.components.length === 0;
    onSave({
      ...form,
      prepTime:     Number(form.prepTime)     || 0,
      cookTime:     Number(form.cookTime)     || 0,
      baseServings: Number(form.baseServings) || 4,
      ingredients:  isSimpleMode ? cleanIngredients(form.ingredients) : undefined,
      steps:        isSimpleMode ? cleanSteps(form.steps)             : undefined,
      components:   cleanComponents,
    });
    showToast(`"${recipeName}" successfully ${initial?.id ? "saved" : "created"}`);
  };

  // ── Styles ───────────────────────────────────────────────────────────────────
  const inputStyle = (err) => ({
    padding: "9px 12px",
    border: `1.5px solid ${err ? "#ef4444" : "var(--border)"}`,
    borderRadius: "var(--r-sm)", fontSize: 14, color: "var(--ink)",
    background: "white", outline: "none", width: "100%", transition: "border-color 0.15s",
  });

  // ── Tab badge counts ─────────────────────────────────────────────────────────
  const countIngs  = (ings)  => ings.filter(i => (i.type === "recipe" ? i.recipeName : i.name).trim()).length;
  const countSteps = (steps) => steps.reduce((acc, s) => acc + (s.text.trim() ? 1 : 0) + s.substeps.filter(sub => sub.text.trim()).length, 0);
  const totalIngCount  = simpleMode ? countIngs(form.ingredients)  : form.components.reduce((n, c) => n + countIngs(c.ingredients), 0);
  const totalStepCount = simpleMode ? countSteps(form.steps)       : form.components.reduce((n, c) => n + countSteps(c.steps), 0);
  const noteLineCount  = form.notes.split("\n").filter(l => l.trim()).length;

  const tabLabel = tab => {
    if (tab === "ingredients" && totalIngCount  > 0) return `Ingredients (${totalIngCount})`;
    if (tab === "steps"       && totalStepCount > 0) return `Steps (${totalStepCount})`;
    if (tab === "notes"       && noteLineCount  > 0) return `Notes (${noteLineCount})`;
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  const currentTabIdx    = FORM_TABS.indexOf(activeTab);
  const isMultiComponent = form.components.length > 1;

  // ── Component selector pill row ───────────────────────────────────────────────
  const ComponentSelector = () => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {form.components.map((comp, idx) => (
          <button
            key={comp.id}
            onClick={() => switchComp(idx)}
            style={{
              flexShrink: 0, padding: "5px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 500,
              background: activeCompIdx === idx ? "var(--fire)" : "var(--surface)",
              color:      activeCompIdx === idx ? "white"        : "var(--ink-soft)",
              border:     activeCompIdx === idx ? "none"         : "1.5px solid var(--border)",
            }}
          >
            {comp.name || `Component ${idx + 1}`}
          </button>
        ))}
      </div>
    </div>
  );

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
            {isPrefillMode ? "Save as Standalone Recipe" : (initial?.id ? "Edit Recipe" : "New Recipe")}
          </h2>
          <button onClick={onCancel} style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--surface)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Tabs — hidden in prefill mode (details only) */}
        {!isPrefillMode && (
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 24px", gap: 4, flexShrink: 0, overflowX: "auto" }}>
            {FORM_TABS.map(tab => (
              <button key={tab} onClick={() => switchTab(tab)} style={{
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
        )}
        {isPrefillMode && <div style={{ borderBottom: "1px solid var(--border)" }} />}

        {/* Body */}
        <div ref={bodyRef} style={{ overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

          {/* ── Details ── */}
          {activeTab === "details" && (
            <>
              {isPrefillMode && (
                <p style={{ fontSize: 12.5, color: "var(--ink-faint)", background: "var(--surface)", padding: "10px 12px", borderRadius: "var(--r-sm)", borderLeft: "3px solid var(--fire)" }}>
                  Ingredients and steps are carried over from the component. Fill in the recipe details below.
                </p>
              )}
              <Field label="Recipe name *">
                <input
                  style={inputStyle(errors.name)} value={form.name}
                  onChange={e => { set("name", e.target.value); if (errors.name) setErrors({}); }}
                  placeholder="e.g. Chef P's Sushi Bake"
                />
                {errors.name && <span style={{ fontSize: 11.5, color: "#ef4444" }}>{errors.name}</span>}
              </Field>

              <Field label="Category">
                <div ref={categoryRef} style={{ position: "relative" }}>
                  {/* Trigger button */}
                  <button
                    onClick={() => setCategoryOpen(o => !o)}
                    style={{
                      ...inputStyle(), display: "flex", alignItems: "center", justifyContent: "space-between",
                      cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <span>
                      {CATEGORY_OPTIONS.find(c => c.name === form.category)?.emoji}{" "}
                      {form.category}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--ink-faint)", marginLeft: 8 }}>
                      {categoryOpen ? "▲" : "▼"}
                    </span>
                  </button>
                  {/* Dropdown grid */}
                  {categoryOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
                      background: "white", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)",
                      boxShadow: "var(--shadow-lg)", padding: 8,
                      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4,
                    }}>
                      {CATEGORY_OPTIONS.map(c => (
                        <button
                          key={c.name}
                          onClick={() => { set("category", c.name); setCategoryOpen(false); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "8px 10px", borderRadius: "var(--r-sm)", fontSize: 13.5,
                            fontWeight: form.category === c.name ? 600 : 400,
                            background: form.category === c.name ? "var(--fire-dim)" : "transparent",
                            color: form.category === c.name ? "var(--fire)" : "var(--ink)",
                            textAlign: "left", cursor: "pointer",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={e => { if (form.category !== c.name) e.currentTarget.style.background = "var(--surface)"; }}
                          onMouseLeave={e => { if (form.category !== c.name) e.currentTarget.style.background = "transparent"; }}
                        >
                          <span style={{ fontSize: 17 }}>{c.emoji}</span>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { label: "Prep (min)", key: "prepTime",    ph: "15" },
                  { label: "Cook (min)", key: "cookTime",    ph: "30" },
                  { label: "Servings",  key: "baseServings", ph: "4"  },
                ].map(f => (
                  <Field key={f.key} label={f.label} style={{ flex: 1 }}>
                    <input style={inputStyle()} type="number" min="0" value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.ph} />
                  </Field>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Field label="Rating" style={{ flex: "none" }}>
                  <StarRating rating={form.rating} interactive onChange={r => set("rating", r)} />
                </Field>
                <Field label="Card color" style={{ flex: "none", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", paddingTop: 2 }}>
                    {CARD_COLORS.map(c => (
                      <button key={c} onClick={() => set("color", c)} style={{
                        width: 24, height: 24, borderRadius: "50%", background: c, flexShrink: 0,
                        border: form.color === c ? "2px solid var(--ink)" : "2px solid transparent",
                        boxShadow: form.color === c ? "0 0 0 2px white inset" : "none",
                        transition: "transform 0.12s", cursor: "pointer",
                      }}
                        onMouseEnter={e => e.target.style.transform = "scale(1.15)"}
                        onMouseLeave={e => e.target.style.transform = "scale(1)"}
                      />
                    ))}
                    {/* Custom color picker as 6th option */}
                    <div style={{ position: "relative", width: 24, height: 24, flexShrink: 0 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: !CARD_COLORS.includes(form.color)
                          ? form.color
                          : "linear-gradient(135deg, #f00 0%, #f80 20%, #ff0 40%, #0c0 60%, #06f 80%, #90f 100%)",
                        border: !CARD_COLORS.includes(form.color) ? "2px solid var(--ink)" : "2px solid transparent",
                        boxShadow: !CARD_COLORS.includes(form.color) ? "0 0 0 2px white inset" : "none",
                        pointerEvents: "none",
                      }} />
                      <input
                        type="color"
                        value={form.color}
                        onChange={e => set("color", e.target.value)}
                        style={{
                          position: "absolute", inset: 0, opacity: 0,
                          width: "100%", height: "100%", cursor: "pointer",
                        }}
                        title="Custom color"
                      />
                    </div>
                  </div>
                </Field>
              </div>

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

              {/* Components manager — hidden when saving a component as standalone */}
              {!isPrefillMode && <Field label="Components">
                <p style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 8 }}>
                  Simple recipes have one component or none. Add more for complex dishes with separate preparations.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {form.components.map((comp, idx) => (
                    <div key={comp.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        style={{ ...inputStyle(), flex: 1 }}
                        value={comp.name}
                        onChange={e => updateComp(comp.id, { name: e.target.value })}
                        placeholder={idx === 0 && form.components.length === 1 ? "Single component (leave blank or remove)" : `Component ${idx + 1} name`}
                      />
                      <input
                        style={{ ...inputStyle(), width: 52 }}
                        type="text" inputMode="decimal"
                        value={comp.yieldAmt}
                        onChange={e => updateComp(comp.id, { yieldAmt: e.target.value })}
                        placeholder="Qty"
                      />
                      <input
                        style={{ ...inputStyle(), width: 90 }}
                        value={comp.yieldUnit}
                        onChange={e => updateComp(comp.id, { yieldUnit: e.target.value })}
                        placeholder="Unit"
                      />
                      <button
                        onClick={() => removeComponent(comp.id)}
                        style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface)", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      >✕</button>
                    </div>
                  ))}
                  <button onClick={addComponent} style={{ fontSize: 13, color: "var(--fire)", fontWeight: 500, textAlign: "left", padding: "4px 0" }}>
                    + Add component
                  </button>
                </div>
              </Field>}
            </>
          )}

          {/* ── Ingredients ── */}
          {activeTab === "ingredients" && (
            <Field label="Ingredients">
              {isMultiComponent && <ComponentSelector />}
              {(() => {
                const otherNamedComps = simpleMode ? [] : form.components.filter(c => c.id !== activeComp.id && c.name.trim());
                const btnStyle = { fontSize: 13, fontWeight: 500, color: "var(--fire)", padding: "4px 0" };

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {activeIngredients.map(ing => {
                      const onRemove = () => removeIng(ing.id);
                      const canRemove = activeIngredients.length > 1;

                      /* Picker row — inline list where the ingredient would be */
                      if (ing.type === "recipe" && ing._picking) {
                        return (
                          <div key={ing.id} ref={pickerRef} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)", overflow: "hidden" }}>
                            <div style={{ padding: "5px 12px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-faint)" }}>Saved Recipes</span>
                            </div>
                            {recipes.length === 0 && <p style={{ padding: "8px 12px", fontSize: 12.5, color: "var(--ink-faint)" }}>No saved recipes yet.</p>}
                            {recipes.map(r => (
                              <button key={r.id}
                                onClick={() => resolvePickerRow(ing.id, null, r)}
                                style={{ width: "100%", padding: "8px 12px", textAlign: "left", fontSize: 13, color: "var(--fire)", fontWeight: 500, borderBottom: "1px solid var(--border)", background: "white", cursor: "pointer", transition: "background 0.12s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
                                onMouseLeave={e => e.currentTarget.style.background = "white"}
                              >{r.name}</button>
                            ))}
                            {otherNamedComps.length > 0 && (
                              <>
                                <div style={{ padding: "5px 12px", background: "var(--surface)", borderBottom: "1px solid var(--border)", borderTop: "1px solid var(--border)" }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-faint)" }}>Components</span>
                                  <span style={{ fontSize: 10, color: "var(--ink-faint)", marginLeft: 6 }}>— not yet saved as recipes</span>
                                </div>
                                {otherNamedComps.map(c => (
                                  <button key={c.id}
                                    onClick={() => resolvePickerRow(ing.id, c.name, null)}
                                    style={{ width: "100%", padding: "8px 12px", textAlign: "left", fontSize: 13, color: "var(--ink)", borderBottom: "1px solid var(--border)", background: "white", cursor: "pointer", transition: "background 0.12s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                                  >{c.name}</button>
                                ))}
                              </>
                            )}
                          </div>
                        );
                      }

                      /* Resolved recipe/component row */
                      if (ing.type === "recipe") {
                        const isComp = !!ing.isCompRef;
                        return (
                          <div key={ing.id} style={{ display: "flex", gap: 6, alignItems: "center", padding: "6px 10px", background: "rgba(232,98,26,0.05)", border: "1px solid rgba(232,98,26,0.18)", borderRadius: "var(--r-sm)" }}>
                            <input
                              style={{ ...inputStyle(), width: 52, background: "white" }} type="text" inputMode="decimal"
                              value={ing.amount} onChange={e => setIng(ing.id, "amount", e.target.value)} placeholder="1"
                            />
                            <span style={{
                              fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                              color: isComp ? "rgba(232,98,26,0.8)" : "var(--fire)",
                              background: isComp ? "rgba(232,98,26,0.12)" : "var(--fire-dim)",
                              padding: "2px 7px", borderRadius: 4, flexShrink: 0, whiteSpace: "nowrap",
                            }}>{isComp ? "component" : "recipe"}</span>
                            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{ing.recipeName}</span>
                            <button onClick={onRemove} style={{ width: 24, height: 24, borderRadius: "50%", background: "white", border: "1px solid var(--border)", fontSize: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                          </div>
                        );
                      }

                      /* Regular ingredient row */
                      return (
                        <div key={ing.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input
                            style={{ ...inputStyle(), width: 64 }} type="text" inputMode="decimal"
                            value={ing.amount} onChange={e => setIng(ing.id, "amount", e.target.value)} placeholder="1"
                          />
                          <select style={{ ...inputStyle(), width: 80, cursor: "pointer" }} value={ing.unit} onChange={e => setIng(ing.id, "unit", e.target.value)}>
                            {UNITS.filter(u => u.value !== "recipe").map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                          </select>
                          <input style={{ ...inputStyle(), flex: 1 }} value={ing.name} onChange={e => setIng(ing.id, "name", e.target.value)} placeholder="ingredient" />
                          <button onClick={onRemove} disabled={!canRemove}
                            style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface)", fontSize: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: canRemove ? 1 : 0.3 }}>✕</button>
                        </div>
                      );
                    })}

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 16, marginTop: 2 }}>
                      <button onClick={addIng} style={btnStyle}>+ Add ingredient</button>
                      <button onClick={addPickerRow} style={{ ...btnStyle, color: "var(--ink-soft)" }}>
                        + Add recipe / component
                      </button>
                    </div>

                  </div>
                );
              })()}
            </Field>
          )}

          {/* ── Steps ── */}
          {activeTab === "steps" && (
            <Field label="Steps">
              {isMultiComponent && <ComponentSelector />}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {activeSteps.map((step, idx) => (
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
                      <button onClick={() => removeStep(step.id)} disabled={activeSteps.length === 1}
                        style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface)", fontSize: 11, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", opacity: activeSteps.length === 1 ? 0.3 : 1 }}>✕</button>
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
                Master recipe notes. Each line will appear as a separate note.
              </p>
              <textarea
                style={{ ...inputStyle(), resize: "vertical", lineHeight: 1.7, minHeight: 180 }}
                value={form.notes} onChange={e => set("notes", e.target.value)}
                placeholder={"Tip 1: use room temperature butter\nTip 2: requires 24 hours advance preparation"}
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
          {!isPrefillMode && (
            <div style={{ borderBottom: "1px solid var(--border)", padding: "10px 24px", display: "flex", justifyContent: "center", gap: 8, background: "white" }}>
              {currentTabIdx > 0 && (
                <button onClick={() => switchTab(FORM_TABS[currentTabIdx - 1])} style={{ padding: "7px 18px", background: "white", color: "var(--ink-soft)", borderRadius: "var(--r-full)", fontSize: 13, fontWeight: 500, border: "1.5px solid var(--border)" }}>← Back</button>
              )}
              {currentTabIdx < FORM_TABS.length - 1 && (
                <button onClick={() => switchTab(FORM_TABS[currentTabIdx + 1])} style={{ padding: "7px 18px", background: "white", color: "var(--ink-soft)", borderRadius: "var(--r-full)", fontSize: 13, fontWeight: 500, border: "1.5px solid var(--border)" }}>Next →</button>
              )}
            </div>
          )}
          <div style={{ padding: "16px 24px", display: "flex", justifyContent: "center" }}>
            <button onClick={handleSave} style={{ padding: "11px 40px", background: "var(--fire)", color: "white", borderRadius: "var(--r-full)", fontSize: 14, fontWeight: 600, boxShadow: "var(--shadow-sm)" }}>
              {isPrefillMode ? "Save to cookbook" : (initial?.id ? "Save changes" : "Add recipe")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
