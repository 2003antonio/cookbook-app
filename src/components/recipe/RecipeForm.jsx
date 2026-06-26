import { useState, useRef, useEffect, useMemo } from "react";
import { StarRating }    from "../ui/StarRating";
import { Field }         from "../ui/Field";
import { showToast }     from "../ui/ToastHost";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import {
  UNITS, CATEGORY_OPTIONS, CARD_COLORS, PART_ICONS,
  newIngredient, newStep, newSubstep, subLetter, normalizeRecipe, newPart,
} from "../../models/recipe";

// ── Folder theme ────────────────────────────────────────────────────────────
// Manila card-stock palette — the whole modal is one tan file folder.
const MANILA       = "#E7D7A4";   // folder body / front flap
const MANILA_LIGHT = "#F1E4BD";   // edge catching the light / hover
const MANILA_DARK  = "#D6C384";   // tabs sitting behind the front (recessed)
const MANILA_EDGE  = "#BFAB6E";   // card-stock cut edges / borders
const MANILA_SEAM  = "#AC9759";   // fold + seam shadow lines
const PAPER        = "#FCFAF3";   // the sheet of paper inside the folder
const FOLDER_INK   = "#5F4F2A";   // stamped-label brown

// Soft tints for the numbered part badges (cycled by index).
const PART_TINTS = [
  "rgba(139,92,246,0.20)", "rgba(232,98,26,0.18)", "rgba(34,197,94,0.18)",
  "rgba(59,130,246,0.18)", "rgba(236,72,153,0.18)", "rgba(245,158,11,0.20)",
];

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

function blankForm() {
  return {
    name: "", category: "Main Dish", prepTime: "", cookTime: "",
    baseServings: 4, color: CARD_COLORS[0], rating: 0,
    tags: [], notes: "",
    parts: [newPart()],
  };
}

// ── RecipeForm ────────────────────────────────────────────────────────────────
export function RecipeForm({ initial, onSave, onCancel, onDelete, recipes = [] }) {
  let _mouseDownOnBackdrop = false;

  const [form, setForm] = useState(() => {
    if (!initial) return blankForm();
    const normalized = normalizeRecipe(initial);
    return {
      ...normalized,
      tags:  normalized.tags || [],
      notes: normalized.notes || "",
      parts: normalized.parts?.length ? normalized.parts : [newPart()],
    };
  });

  const isExistingRecipe = !!initial?.id;
  const initialSnapshotRef = useRef(JSON.stringify(form));

  const [activeTab,     setActiveTab]     = useState("details");
  const [activePartIdx, setActivePartIdx] = useState(0);
  const [tagInput,      setTagInput]      = useState("");
  const [errors,        setErrors]        = useState({});
  const [categoryOpen,  setCategoryOpen]  = useState(false);
  const [iconPickerFor, setIconPickerFor] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showExitConfirm,   setShowExitConfirm]   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const categoryRef   = useRef(null);
  const iconPickerRef = useRef(null);
  const bodyRef       = useRef(null);
  const scrollToBottom = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }));

  // ── Modes & active part ──────────────────────────────────────────────────────
  const multiPart  = form.parts.length > 1;
  const formTabs   = useMemo(() => (
    multiPart
      ? ["details", "parts", "ingredients", "steps", "notes"]
      : ["details", "ingredients", "steps", "notes"]
  ), [multiPart]);
  const activePart = form.parts[activePartIdx] ?? form.parts[0];

  // Keep activeTab / activePartIdx valid as parts are added/removed.
  useEffect(() => {
    if (!formTabs.includes(activeTab)) setActiveTab("details");
  }, [formTabs, activeTab]);
  useEffect(() => {
    if (activePartIdx > form.parts.length - 1) setActivePartIdx(form.parts.length - 1);
  }, [form.parts.length, activePartIdx]);

  // ── Form-level setters ───────────────────────────────────────────────────────
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── Part setters ─────────────────────────────────────────────────────────────
  const updatePart = (partId, changes) =>
    set("parts", form.parts.map(p => p.id === partId ? { ...p, ...changes } : p));

  const addPart = () => {
    set("parts", [...form.parts, newPart()]);
    setActivePartIdx(form.parts.length);
    scrollToBottom();
  };

  const removePart = (partId) =>
    set("parts", form.parts.filter(p => p.id !== partId));

  const movePart = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= form.parts.length) return;
    const next = [...form.parts];
    [next[idx], next[j]] = [next[j], next[idx]];
    set("parts", next);
  };

  // Convert a simple recipe into a multi-part one.
  const breakIntoParts = () => {
    set("parts", [...form.parts, newPart()]);
    setActivePartIdx(form.parts.length);
    setActiveTab("parts");
    scrollToBottom();
  };

  // ── Ingredient / step setters (scoped to the active part) ────────────────────
  const activeIngredients = activePart?.ingredients ?? [];
  const activeSteps       = activePart?.steps       ?? [];
  const setIngList  = (ings)  => updatePart(activePart.id, { ingredients: ings });
  const setStepList = (steps) => updatePart(activePart.id, { steps });

  const setIng       = (ingId, k, v) => setIngList(activeIngredients.map(i => i.id === ingId ? { ...i, [k]: v } : i));
  const addIng       = ()            => { setIngList([...activeIngredients, newIngredient()]); scrollToBottom(); };
  const removeIng    = (id)          => setIngList(activeIngredients.filter(i => i.id !== id));

  const setStepText    = (stepId, val)      => setStepList(activeSteps.map(s => s.id === stepId ? { ...s, text: val } : s));
  const addStep        = ()                 => { setStepList([...activeSteps, newStep()]); scrollToBottom(); };
  const removeStep     = (stepId)           => setStepList(activeSteps.filter(s => s.id !== stepId));
  const addSubstep     = (stepId)           => { setStepList(activeSteps.map(s => s.id === stepId ? { ...s, substeps: [...s.substeps, newSubstep()] } : s)); scrollToBottom(); };
  const setSubstepText = (stepId, subId, v) => setStepList(activeSteps.map(s => s.id === stepId ? { ...s, substeps: s.substeps.map(sub => sub.id === subId ? { ...sub, text: v } : sub) } : s));
  const removeSubstep  = (stepId, subId)    => setStepList(activeSteps.map(s => s.id === stepId ? { ...s, substeps: s.substeps.filter(sub => sub.id !== subId) } : s));

  // ── Tag setters ──────────────────────────────────────────────────────────────
  const addTag    = () => { const t = tagInput.trim(); if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]); setTagInput(""); };
  const removeTag = t  => set("tags", form.tags.filter(x => x !== t));

  // ── Close dropdowns on click-outside ─────────────────────────────────────────
  useEffect(() => {
    if (!categoryOpen) return;
    const handler = (e) => { if (categoryRef.current && !categoryRef.current.contains(e.target)) setCategoryOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [categoryOpen]);

  useEffect(() => {
    if (!iconPickerFor) return;
    const handler = (e) => { if (iconPickerRef.current && !iconPickerRef.current.contains(e.target)) setIconPickerFor(null); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [iconPickerFor]);

  // ── Exit / discard / delete ──────────────────────────────────────────────────
  const attemptCancel = () => {
    if (JSON.stringify(form) !== initialSnapshotRef.current) setShowExitConfirm(true);
    else onCancel();
  };

  const exitDialog = isExistingRecipe
    ? { icon: "⚠️", iconBg: "#FEF3C7", title: "Discard your changes?", subtitle: "All unsaved changes will be lost.", cancelLabel: "No, Go Back", confirmLabel: "Yes, Discard" }
    : { icon: "✕",  iconBg: "#FEE2E2", title: "Exit without saving?",  subtitle: "All unsaved changes will be lost.", cancelLabel: "Stay Here",   confirmLabel: "Exit" };

  const handleDelete = () => {
    const name = initial.name;
    onDelete(initial.id);
    showToast(`"${name}" successfully deleted`);
    onCancel();
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!form.name.trim()) { setErrors({ name: "Name is required" }); setActiveTab("details"); return; }

    const cleanIngredients = (ings) => ings
      .filter(i => i.type === "recipe" ? i.recipeName?.trim() : i.name.trim())
      .map(i => i.type === "recipe" ? i : { ...i, amount: parseAmount(i.amount) });
    const cleanSteps = (steps) => steps
      .map(s => ({
        id:       s.id,
        text:     s.text.trim(),
        substeps: s.substeps.map(sub => ({ id: sub.id, text: sub.text.trim() })).filter(sub => sub.text),
      }))
      .filter(s => s.text || s.substeps.length > 0);

    let cleanParts = form.parts.map(part => ({
      id:          part.id,
      name:        part.name.trim(),
      description: part.description.trim(),
      icon:        part.icon || "",
      ingredients: cleanIngredients(part.ingredients),
      steps:       cleanSteps(part.steps),
    }));
    // Drop fully-empty extra parts, but always keep at least one.
    cleanParts = cleanParts.filter(p => p.name || p.description || p.ingredients.length || p.steps.length);
    if (cleanParts.length === 0) cleanParts = [{ ...form.parts[0], name: "", description: "", icon: "", ingredients: [], steps: [] }];

    const recipeName = form.name.trim();
    onSave({
      ...form,
      name:         recipeName,
      prepTime:     Number(form.prepTime)     || 0,
      cookTime:     Number(form.cookTime)     || 0,
      baseServings: Number(form.baseServings) || 4,
      parts:        cleanParts,
    });
    showToast(`"${recipeName}" successfully ${isExistingRecipe ? "saved" : "created"}`);
  };

  // ── Styles ───────────────────────────────────────────────────────────────────
  const inputStyle = (err) => ({
    padding: "9px 12px",
    border: `1.5px solid ${err ? "#ef4444" : "var(--border)"}`,
    borderRadius: "var(--r-sm)", fontSize: 14, color: "var(--ink)",
    background: "white", outline: "none", width: "100%", transition: "border-color 0.15s",
  });

  // ── Tab counts / labels ──────────────────────────────────────────────────────
  const countIngs  = (ings)  => ings.filter(i => (i.type === "recipe" ? i.recipeName : i.name)?.trim()).length;
  const countSteps = (steps) => steps.reduce((acc, s) => acc + (s.text.trim() ? 1 : 0) + s.substeps.filter(sub => sub.text.trim()).length, 0);
  const totalIngCount  = form.parts.reduce((n, p) => n + countIngs(p.ingredients), 0);
  const totalStepCount = form.parts.reduce((n, p) => n + countSteps(p.steps), 0);
  const noteLineCount  = form.notes.split("\n").filter(l => l.trim()).length;

  const tabLabel = tab => {
    if (tab === "parts")                            return `Parts (${form.parts.length})`;
    if (tab === "ingredients" && totalIngCount  > 0) return `Ingredients (${totalIngCount})`;
    if (tab === "steps"       && totalStepCount > 0) return `Steps (${totalStepCount})`;
    if (tab === "notes"       && noteLineCount  > 0) return `Notes (${noteLineCount})`;
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  const currentTabIdx = formTabs.indexOf(activeTab);
  const titleText = `${isExistingRecipe ? "Edit" : "New"}${multiPart ? " Multi-part" : ""} Recipe`;

  // ── Part selector pill row (Ingredients / Steps tabs, multi-part only) ────────
  const PartSelector = () => (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
      {form.parts.map((part, idx) => (
        <button
          key={part.id}
          onClick={() => setActivePartIdx(idx)}
          style={{
            flexShrink: 0, padding: "5px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 5,
            background: activePartIdx === idx ? "var(--fire)" : "var(--surface)",
            color:      activePartIdx === idx ? "white"        : "var(--ink-soft)",
            border:     activePartIdx === idx ? "none"         : "1.5px solid var(--border)",
          }}
        >
          {part.icon && <span>{part.icon}</span>}
          {part.name || `Part ${idx + 1}`}
        </button>
      ))}
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
      onClick={e => { if (e.target === e.currentTarget && _mouseDownOnBackdrop) attemptCancel(); }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560, maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          borderRadius: "12px", overflow: "hidden",
          background: MANILA,
          backgroundImage: `linear-gradient(180deg, ${MANILA_LIGHT} 0%, ${MANILA} 16%, ${MANILA} 90%, ${MANILA_DARK} 100%)`,
          border: `1px solid ${MANILA_EDGE}`,
          boxShadow: "0 24px 60px rgba(60,45,15,0.45), 0 4px 14px rgba(0,0,0,0.22)",
        }}
      >
        {/* Folder index tabs — sticking up along the top edge */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, padding: "10px 10px 0", overflowX: "auto", flexShrink: 0 }}>
          {formTabs.map(tab => {
            const active   = activeTab === tab;
            const tabError = tab === "details" && errors.name;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flexShrink: 0, whiteSpace: "nowrap",
                padding: active ? "8px 14px 12px" : "6px 14px 9px",
                borderRadius: "9px 9px 0 0",
                border: `1px solid ${MANILA_EDGE}`, borderBottom: "none",
                marginBottom: active ? -1.5 : 3,
                background: active ? MANILA : MANILA_DARK,
                color: tabError ? "#C0392B" : FOLDER_INK,
                fontFamily: "var(--font-display)",
                fontSize: 12.5, fontWeight: active ? 700 : 500,
                opacity: active ? 1 : 0.92,
                boxShadow: active
                  ? "0 -2px 4px rgba(90,70,25,0.10)"
                  : "inset 0 -4px 6px -2px rgba(120,98,45,0.30)",
                zIndex: active ? 3 : 1, transition: "all 0.15s",
              }}>
                {tabLabel(tab)}{tabError ? " ⚠" : ""}
              </button>
            );
          })}
        </div>

        {/* Folder interior */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, borderTop: `1.5px solid ${MANILA_SEAM}` }}>
          {/* Stamped label + paperclip + close */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 8px", flexShrink: 0, gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>🗂️</span>
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: FOLDER_INK,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{titleText}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 16, transform: "rotate(20deg)", display: "inline-block" }}>📎</span>
              <button onClick={attemptCancel} style={{ width: 26, height: 26, borderRadius: "50%", background: MANILA_LIGHT, border: `1px solid ${MANILA_EDGE}`, color: FOLDER_INK, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>

          {/* Sheet of paper tucked inside the folder */}
          <div style={{ flex: 1, display: "flex", minHeight: 0, padding: "0 12px 12px" }}>
            <div ref={bodyRef} style={{
              flex: 1, overflowY: "auto", background: PAPER,
              borderRadius: "4px", border: `1px solid ${MANILA_EDGE}`,
              boxShadow: "0 1px 5px rgba(80,60,20,0.18)",
              padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14,
            }}>

          {/* ── Details ── */}
          {activeTab === "details" && (
            <>
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
                  <button
                    onClick={() => setCategoryOpen(o => !o)}
                    style={{ ...inputStyle(), display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left" }}
                  >
                    <span>
                      {CATEGORY_OPTIONS.find(c => c.name === form.category)?.emoji}{" "}
                      {form.category}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--ink-faint)", marginLeft: 8 }}>{categoryOpen ? "▲" : "▼"}</span>
                  </button>
                  {categoryOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
                      background: "white", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)",
                      boxShadow: "var(--shadow-lg)", padding: 8,
                      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4,
                      maxHeight: 280, overflowY: "auto", overscrollBehavior: "contain",
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
                            textAlign: "left", cursor: "pointer", transition: "background 0.1s",
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
                        type="color" value={form.color} onChange={e => set("color", e.target.value)}
                        style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
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
            </>
          )}

          {/* ── Parts (multi-part only) ── */}
          {activeTab === "parts" && (
            <Field label="Parts">
              {!bannerDismissed && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12,
                  padding: "10px 12px", background: "rgba(172,151,89,0.12)",
                  border: `1px solid ${MANILA_EDGE}`, borderRadius: "var(--r-sm)",
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>🗒️</span>
                  <p style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5, flex: 1 }}>
                    A multi-part recipe is made up of sections or stages — a sauce, a filling, the assembly.
                    Add, reorder, and edit each part below.
                  </p>
                  <button onClick={() => setBannerDismissed(true)} style={{ fontSize: 12, color: "var(--ink-faint)", flexShrink: 0 }}>✕</button>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {form.parts.map((part, idx) => {
                  const ingN  = countIngs(part.ingredients);
                  const stepN = countSteps(part.steps);
                  return (
                    <div key={part.id} style={{
                      border: `1px solid ${MANILA_EDGE}`, borderRadius: "var(--r-md)",
                      padding: "10px 12px", background: "rgba(172,151,89,0.07)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                          background: PART_TINTS[idx % PART_TINTS.length], color: "var(--ink)",
                          fontSize: 12.5, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>{idx + 1}</span>

                        <input
                          style={{ ...inputStyle(), flex: 1, fontWeight: 600 }}
                          value={part.name}
                          onChange={e => updatePart(part.id, { name: e.target.value })}
                          placeholder={`Part ${idx + 1} name (e.g. The Sauce)`}
                        />

                        {/* Icon picker */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <button
                            onClick={() => setIconPickerFor(p => p === part.id ? null : part.id)}
                            title="Pick an icon"
                            style={{
                              width: 36, height: 36, borderRadius: "var(--r-sm)", fontSize: 17,
                              border: "1.5px solid var(--border)", background: "var(--surface)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >{part.icon || "＋"}</button>
                          {iconPickerFor === part.id && (
                            <div ref={iconPickerRef} style={{
                              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 60,
                              background: "white", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)",
                              boxShadow: "var(--shadow-lg)", padding: 8,
                              display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, width: 232,
                            }}>
                              {PART_ICONS.map(emo => (
                                <button key={emo}
                                  onClick={() => { updatePart(part.id, { icon: part.icon === emo ? "" : emo }); setIconPickerFor(null); }}
                                  style={{
                                    width: 32, height: 32, borderRadius: "var(--r-sm)", fontSize: 17,
                                    background: part.icon === emo ? "var(--fire-dim)" : "transparent",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}
                                  onMouseEnter={e => { if (part.icon !== emo) e.currentTarget.style.background = "var(--surface)"; }}
                                  onMouseLeave={e => { if (part.icon !== emo) e.currentTarget.style.background = "transparent"; }}
                                >{emo}</button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Reorder */}
                        <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
                          <button onClick={() => movePart(idx, -1)} disabled={idx === 0}
                            style={{ fontSize: 10, color: "var(--ink-faint)", opacity: idx === 0 ? 0.25 : 1, lineHeight: 1 }}>▲</button>
                          <button onClick={() => movePart(idx, 1)} disabled={idx === form.parts.length - 1}
                            style={{ fontSize: 10, color: "var(--ink-faint)", opacity: idx === form.parts.length - 1 ? 0.25 : 1, lineHeight: 1 }}>▼</button>
                        </div>

                        <button onClick={() => removePart(part.id)}
                          style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface)", fontSize: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                      </div>

                      <input
                        style={{ ...inputStyle(), marginTop: 8, fontSize: 12.5 }}
                        value={part.description}
                        onChange={e => updatePart(part.id, { description: e.target.value })}
                        placeholder="Short description (e.g. Gather and prepare ingredients)"
                      />

                      <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                        <button onClick={() => { setActivePartIdx(idx); setActiveTab("ingredients"); }}
                          style={{ fontSize: 12, fontWeight: 500, color: "var(--fire)" }}>
                          {ingN > 0 ? `${ingN} ingredient${ingN > 1 ? "s" : ""}` : "Add ingredients"} →
                        </button>
                        <button onClick={() => { setActivePartIdx(idx); setActiveTab("steps"); }}
                          style={{ fontSize: 12, fontWeight: 500, color: "var(--fire)" }}>
                          {stepN > 0 ? `${stepN} step${stepN > 1 ? "s" : ""}` : "Add steps"} →
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={addPart}
                  style={{
                    border: "1.5px dashed var(--border)", borderRadius: "var(--r-md)",
                    padding: "12px", fontSize: 13, fontWeight: 600, color: "var(--ink-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >＋ Add New Part</button>
              </div>
            </Field>
          )}

          {/* ── Ingredients ── */}
          {activeTab === "ingredients" && (
            <Field label={multiPart ? `Ingredients — ${activePart?.name || `Part ${activePartIdx + 1}`}` : "Ingredients"}>
              {multiPart && <PartSelector />}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                        style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface)", fontSize: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: canRemove ? 1 : 0.3 }}>✕</button>
                    </div>
                  );
                })}
                <button onClick={addIng} style={{ fontSize: 13, fontWeight: 500, color: "var(--fire)", padding: "4px 0", textAlign: "left" }}>+ Add ingredient</button>
              </div>
            </Field>
          )}

          {/* ── Steps ── */}
          {activeTab === "steps" && (
            <Field label={multiPart ? `Steps — ${activePart?.name || `Part ${activePartIdx + 1}`}` : "Steps"}>
              {multiPart && <PartSelector />}
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
                        placeholder={`Step description…`} rows={2}
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
                              placeholder={`Add detail to this step…`} rows={1}
                            />
                            <button onClick={() => removeSubstep(step.id, sub.id)}
                              style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--surface)", fontSize: 10, marginTop: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button onClick={() => addSubstep(step.id)} style={{ fontSize: 12.5, color: "var(--ink-faint)", fontWeight: 500, textAlign: "left", marginLeft: 32, padding: "2px 0" }}>
                      + Add detail
                    </button>
                  </div>
                ))}
                <button onClick={addStep} style={{ fontSize: 13, color: "var(--fire)", fontWeight: 500, textAlign: "left", padding: "4px 0" }}>+ Add Step</button>

                {!multiPart && (
                  <button onClick={breakIntoParts} style={{
                    marginTop: 6, fontSize: 12.5, fontWeight: 500, color: "var(--ink-soft)",
                    border: "1.5px dashed var(--border)", borderRadius: "var(--r-sm)", padding: "8px",
                  }}>
                    ⧉ Break this recipe into parts
                  </button>
                )}
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
              {noteLineCount > 0 && (
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
          </div>
        </div>

        {/* Footer — delete (left) · back/next (center) · save (right) */}
        <div style={{
          flexShrink: 0, background: MANILA_DARK, borderTop: `1.5px solid ${MANILA_SEAM}`,
          padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
        }}>
          <div style={{ display: "flex", flexShrink: 0 }}>
            {isExistingRecipe && (
              <button onClick={() => setShowDeleteConfirm(true)} style={{ fontSize: 13, fontWeight: 600, color: "#9C2A1B", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                🗑 Delete
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {currentTabIdx > 0 && (
              <button onClick={() => setActiveTab(formTabs[currentTabIdx - 1])} title="Back" style={{ padding: "7px 13px", background: PAPER, color: FOLDER_INK, borderRadius: "var(--r-full)", fontSize: 14, fontWeight: 600, border: `1px solid ${MANILA_EDGE}` }}>←</button>
            )}
            {currentTabIdx < formTabs.length - 1 && (
              <button onClick={() => setActiveTab(formTabs[currentTabIdx + 1])} title="Next" style={{ padding: "7px 13px", background: PAPER, color: FOLDER_INK, borderRadius: "var(--r-full)", fontSize: 14, fontWeight: 600, border: `1px solid ${MANILA_EDGE}` }}>→</button>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
            <button onClick={handleSave} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 16px", background: "rgba(34,197,94,0.14)", color: "#15803D", borderRadius: "var(--r-full)", fontSize: 13.5, fontWeight: 600, border: "1.5px solid rgba(34,197,94,0.4)", whiteSpace: "nowrap" }}>
              💾 {isExistingRecipe ? "Save Changes" : "Add Recipe"}
            </button>
          </div>
        </div>
      </div>

      {showExitConfirm && (
        <ConfirmDialog
          {...exitDialog}
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={() => { setShowExitConfirm(false); onCancel(); }}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          icon="🗑" iconBg="#FEE2E2"
          title="Delete this recipe?" subtitle="This action cannot be undone."
          cancelLabel="No, Cancel" confirmLabel="Yes, Delete"
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
