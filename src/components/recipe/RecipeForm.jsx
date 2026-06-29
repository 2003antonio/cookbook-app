import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { StarRating }    from "../ui/StarRating";
import { Field }         from "../ui/Field";
import { showToast }     from "../ui/ToastHost";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import {
  UNITS, CATEGORY_OPTIONS, CARD_COLORS, PART_ICONS,
  newIngredient, newStep, newSubstep, subLetter, normalizeRecipe, newPart, hexToRgba,
} from "../../models/recipe";
import { readImageFile } from "../../utils/image";

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
    baseServings: 4, color: CARD_COLORS[0], image: "", rating: 0,
    tags: [], notes: "",
    parts: [newPart()],
  };
}

// ── Auto-growing textarea ─────────────────────────────────────────────────────
// Grows with its content from `minRows` up to `maxLines`, then scrolls internally
// so the user never has to scroll inside a small box while typing.
function AutoTextarea({ value, minRows = 1, maxLines = 8, style, ...rest }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const cs       = window.getComputedStyle(el);
    const lh       = parseFloat(cs.lineHeight) || 20;
    const padV     = parseFloat(cs.paddingTop)   + parseFloat(cs.paddingBottom);
    const borderV  = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    const minH     = lh * minRows  + padV + borderV;
    const maxH     = lh * maxLines + padV + borderV;
    const next     = Math.min(Math.max(el.scrollHeight + borderV, minH), maxH);
    el.style.height    = `${next}px`;
    el.style.overflowY = el.scrollHeight + borderV > maxH ? "auto" : "hidden";
  }, [value, minRows, maxLines]);
  return <textarea ref={ref} value={value} style={{ ...style, resize: "none" }} {...rest} />;
}

// ── RecipeForm ────────────────────────────────────────────────────────────────
export function RecipeForm({ initial, onSave, onCancel, onDelete, recipes = [], isEntering = false }) {
  let _mouseDownOnBackdrop = false;

  const [form, setForm] = useState(() => {
    if (!initial) return blankForm();
    const normalized = normalizeRecipe(initial);
    return {
      ...normalized,
      tags:  normalized.tags || [],
      notes: normalized.notes || "",
      image: normalized.image || "",
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
  const [imageBusy,  setImageBusy]  = useState(false);
  const [imageError, setImageError] = useState("");

  const categoryRef   = useRef(null);
  const iconPickerRef = useRef(null);
  const imageInputRef = useRef(null);
  const bodyRef       = useRef(null);
  const scrollToBottom = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }));

  // Lock the page behind the modal so it can't scroll while the form is open.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

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

  // ── Cover photo ──────────────────────────────────────────────────────────────
  const handleImagePick = async (file) => {
    if (!file) return;
    setImageError("");
    setImageBusy(true);
    try {
      const dataUrl = await readImageFile(file);
      set("image", dataUrl);
    } catch (err) {
      setImageError(err?.message || "Could not add that image");
    } finally {
      setImageBusy(false);
    }
  };

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

  // Drag-to-reorder tags — order matters since the card only shows the first 3.
  const [dragTagIdx, setDragTagIdx] = useState(null);
  const moveTag = (from, to) => {
    if (from == null || to == null || from === to) return;
    setForm(f => {
      const next = [...f.tags];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...f, tags: next };
    });
  };

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
    border: `1px solid ${err ? "#ef4444" : "var(--border)"}`,
    borderRadius: "var(--r-sm)", fontSize: 14, color: "var(--ink)",
    background: "var(--surface)", outline: "none", width: "100%", transition: "border-color 0.15s",
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
  const titleText = `${isExistingRecipe ? "Edit" : "New"}${multiPart ? " Multi-Part" : ""} Recipe`;

  // Tab-switch animation direction: +1 when moving to a later tab, −1 to an earlier one.
  // hasTabSwitched starts false so the initial render has no slide animation.
  // Both refs are updated during render (not in an effect) so the class is ready
  // on the same render that the tab change happens.
  const prevTabIdxRef  = useRef(currentTabIdx);
  const hasTabSwitched = useRef(false);
  const slideDir = currentTabIdx >= prevTabIdxRef.current ? 1 : -1;
  if (prevTabIdxRef.current !== currentTabIdx) {
    hasTabSwitched.current  = true;
    prevTabIdxRef.current   = currentTabIdx;
  }

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
            border:     "none",
          }}
        >
          {part.icon && <span>{part.icon}</span>}
          {part.name || `Part ${idx + 1}`}
        </button>
      ))}
    </div>
  );

  // Overlay buttons on the cover-photo preview (readable over any image).
  const imgActionBtn = {
    padding: "5px 11px", borderRadius: 999, fontSize: 12, fontWeight: 600,
    background: "rgba(0,0,0,0.55)", color: "white", backdropFilter: "blur(4px)",
  };

  // ── Footer nav / action buttons ──────────────────────────────────────────────
  const navBtnStyle = {
    width: 34, height: 34, borderRadius: "50%",
    background: "var(--surface)", color: "var(--ink-soft)",
    fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
  };

  return (
    // Transparent click-catcher — backdrop is rendered by App.js
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onMouseDown={e => { _mouseDownOnBackdrop = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && _mouseDownOnBackdrop) attemptCancel(); }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={isEntering ? "modal-entering" : undefined}
        style={{
          width: "100%", maxWidth: 560, minHeight: "min(600px, 90vh)", maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          borderRadius: "var(--r-md)", overflow: "hidden",
          background: "var(--card-bg)",
          boxShadow: "0 0 0 1px var(--border), var(--shadow-lg)",
        }}
      >
        {/* Header — dark title bar */}
        <div style={{ display: "flex", background: "var(--night)", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", flexShrink: 0, gap: 8 }}>
          <span style={{
            fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, color: "white",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{titleText}</span>
          <button
            onClick={attemptCancel}
            style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.14)", color: "white", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.26)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
          >✕</button>
        </div>

        {/* Tabs — equal width, underline indicator (continues the dark bar) */}
        <div style={{ display: "flex", background: "var(--night)", padding: "0 12px", flexShrink: 0 }}>
          {formTabs.map((tab, i) => {
            const active   = activeTab === tab;
            const tabError = tab === "details" && errors.name;
            const notLast  = i < formTabs.length - 1;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                padding: "12px 4px",
                fontSize: 12.5, fontWeight: active ? 600 : 500,
                color: tabError ? "#F87171" : active ? "var(--fire)" : "rgba(255,255,255,0.55)",
                borderBottom: active ? "2px solid var(--fire)" : "2px solid transparent",
                borderRight: notLast ? "1px solid rgba(232,98,26,0.35)" : "none",
                transition: "color 0.15s",
              }}>
                {tabLabel(tab)}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div ref={bodyRef} style={{
          flex: 1, overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain", minHeight: 0, background: "var(--card-bg)",
          padding: "20px", display: "flex", flexDirection: "column",
        }}>
          {/* Animated tab panel — keyed by activeTab so the sweep-in replays on every switch */}
          <div
            key={activeTab}
            className={hasTabSwitched.current ? `tab-panel tab-panel--${slideDir >= 0 ? "next" : "prev"}` : undefined}
            style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}
          >

          {/* ── Details ── */}
          {activeTab === "details" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, justifyContent: "space-between" }}>
              <Field label="Cover photo">
                <input
                  ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => { handleImagePick(e.target.files?.[0]); e.target.value = ""; }}
                />
                {form.image ? (
                  <div style={{ position: "relative", height: 150, borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--border)" }}>
                    <img src={form.image} alt="Recipe cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
                      <button type="button" onClick={() => imageInputRef.current?.click()} style={imgActionBtn}>
                        {imageBusy ? "…" : "Replace"}
                      </button>
                      <button type="button" onClick={() => { set("image", ""); setImageError(""); }} style={imgActionBtn}>
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button" onClick={() => imageInputRef.current?.click()} disabled={imageBusy}
                    style={{
                      height: 120, width: "100%", borderRadius: "var(--r-md)",
                      border: "1.5px dashed var(--border)", background: hexToRgba(form.color, 0.12),
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 5, color: "var(--ink-soft)", cursor: imageBusy ? "default" : "pointer",
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{imageBusy ? "⏳" : "📷"}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{imageBusy ? "Adding photo…" : "Add a cover photo"}</span>
                    <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>A photo of the finished dish</span>
                  </button>
                )}
                {imageError && <span style={{ fontSize: 11.5, color: "#ef4444" }}>{imageError}</span>}
              </Field>

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
                      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
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
                        boxShadow: form.color === c ? "0 0 0 2px var(--card-bg) inset" : "none",
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
                  <button onClick={addTag} style={{ padding: "9px 16px", background: "var(--surface)", borderRadius: "var(--r-sm)", fontSize: 13.5, fontWeight: 500, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>Add</button>
                </div>
                {form.tags.length > 0 && (
                  <>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {form.tags.map((t, idx) => (
                        <span
                          key={t}
                          draggable
                          onDragStart={() => setDragTagIdx(idx)}
                          onDragEnter={() => { if (dragTagIdx !== null) { moveTag(dragTagIdx, idx); setDragTagIdx(idx); } }}
                          onDragOver={e => e.preventDefault()}
                          onDragEnd={() => setDragTagIdx(null)}
                          style={{
                            display: "flex", alignItems: "center", gap: 4, padding: "3px 10px",
                            background: "var(--fire-dim)", color: "var(--fire)", borderRadius: 999,
                            fontSize: 12.5, fontWeight: 500,
                            cursor: "grab", opacity: dragTagIdx === idx ? 0.5 : 1,
                          }}
                        >
                          {t}
                          <button onClick={() => removeTag(t)} style={{ fontSize: 10, color: "var(--fire)", opacity: 0.6 }}>✕</button>
                        </span>
                      ))}
                    </div>
                    {form.tags.length > 3 && (
                      <p style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 6, lineHeight: 1.4 }}>
                        Please note the first 3 tags will be the ones shown on the recipe card.
                      </p>
                    )}
                  </>
                )}
              </Field>
            </div>
          )}

          {/* ── Parts (multi-part only) ── */}
          {activeTab === "parts" && (
            <Field label="Parts" style={{ flex: 1 }}>
              {!bannerDismissed && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6,
                  padding: "8px 12px", background: "var(--surface)",
                  borderRadius: "var(--r-sm)",
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>🗒️</span>
                  <p style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.45, flex: 1 }}>
                    Build your dish in stages — a sauce, a filling, the assembly.
                  </p>
                  <button onClick={() => setBannerDismissed(true)} style={{ fontSize: 12, color: "var(--ink-faint)", flexShrink: 0 }}>✕</button>
                </div>
              )}

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {form.parts.map((part, idx) => {
                  const ingN  = countIngs(part.ingredients);
                  const stepN = countSteps(part.steps);
                  return (
                    <div key={part.id} style={{
                      border: "1px solid var(--border)", borderRadius: "var(--r-md)",
                      padding: "9px 12px", background: "var(--surface)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                          background: "var(--fire-dim)", color: "var(--fire)",
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
                              border: "1px solid var(--border)", background: "var(--surface)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >{part.icon || "＋"}</button>
                          {iconPickerFor === part.id && (
                            <div ref={iconPickerRef} style={{
                              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 60,
                              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
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
                          style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface)", color: "var(--ink-soft)", fontSize: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
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
                    border: "1px dashed var(--border)", borderRadius: "var(--r-md)",
                    padding: "12px", fontSize: 13, fontWeight: 600, color: "var(--ink-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    marginTop: "auto",
                  }}
                >＋ Add New Part</button>
              </div>
            </Field>
          )}

          {/* ── Ingredients ── */}
          {activeTab === "ingredients" && (
            <Field label={multiPart ? `Ingredients — ${activePart?.name || `Part ${activePartIdx + 1}`}` : "Ingredients"} style={{ flex: 1 }}>
              {multiPart && <PartSelector />}
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
          )}

          {/* ── Steps ── */}
          {activeTab === "steps" && (
            <Field label={multiPart ? `Steps — ${activePart?.name || `Part ${activePartIdx + 1}`}` : "Steps"} style={{ flex: 1 }}>
              {multiPart && <PartSelector />}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                {activeSteps.map((step, idx) => (
                  <div key={step.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: "50%", background: "var(--fire-dim)",
                        color: "var(--fire)", fontSize: 12, fontWeight: 700, marginTop: 8, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{idx + 1}</span>
                      <AutoTextarea
                        style={{ ...inputStyle(), lineHeight: 1.5, flex: 1 }}
                        value={step.text} onChange={e => setStepText(step.id, e.target.value)}
                        placeholder={`Step description…`} minRows={2} maxLines={8}
                      />
                      <button onClick={() => removeStep(step.id)} disabled={activeSteps.length === 1}
                        style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface)", color: "var(--ink-soft)", fontSize: 11, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", opacity: activeSteps.length === 1 ? 0.3 : 1 }}>✕</button>
                    </div>

                    {step.substeps.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 12, paddingLeft: 16, borderLeft: "2px solid var(--border)" }}>
                        {step.substeps.map((sub, subIdx) => (
                          <div key={sub.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <span style={{
                              width: 22, height: 22, borderRadius: "50%", background: "var(--surface)",
                              border: "1.5px solid var(--fire-dim)", color: "var(--fire)",
                              fontSize: 11, fontWeight: 700, marginTop: 7, flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>{subLetter(subIdx)}</span>
                            <AutoTextarea
                              style={{ ...inputStyle(), lineHeight: 1.5, flex: 1 }}
                              value={sub.text} onChange={e => setSubstepText(step.id, sub.id, e.target.value)}
                              placeholder={`Add detail to this step…`} minRows={1} maxLines={8}
                            />
                            <button onClick={() => removeSubstep(step.id, sub.id)}
                              style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--surface)", color: "var(--ink-soft)", fontSize: 10, marginTop: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button onClick={() => addSubstep(step.id)} style={{ fontSize: 12.5, color: "var(--ink-faint)", fontWeight: 500, textAlign: "left", marginLeft: 32, padding: "2px 0" }}>
                      + Add detail
                    </button>
                  </div>
                ))}
                <button onClick={addStep} style={{ fontSize: 13, color: "var(--fire)", fontWeight: 500, textAlign: "left", padding: "4px 0", marginTop: "auto" }}>+ Add Step</button>

                {!multiPart && (
                  <button onClick={breakIntoParts} style={{
                    marginTop: 6, fontSize: 12.5, fontWeight: 500, color: "var(--ink-soft)",
                    border: "1px dashed var(--border)", borderRadius: "var(--r-sm)", padding: "8px",
                  }}>
                    ⧉ Break this recipe into parts
                  </button>
                )}
              </div>
            </Field>
          )}

          {/* ── Notes ── */}
          {activeTab === "notes" && (
            <Field label="Notes & tips" style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 4 }}>
                Master recipe notes. Each line will appear as a separate note.
              </p>
              <textarea
                style={{ ...inputStyle(), resize: "vertical", lineHeight: 1.7, flex: 1, minHeight: 120 }}
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

        {/* Footer — delete (left) · back/next (center) · save (right) */}
        <div style={{
          flexShrink: 0, background: "var(--card-bg)", borderTop: "1px solid var(--border)",
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 6,
        }}>
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
            {isExistingRecipe && (
              <button onClick={() => setShowDeleteConfirm(true)} style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-faint)", whiteSpace: "nowrap", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#C0392B"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--ink-faint)"}>
                Delete
              </button>
            )}
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 8 }}>
            {currentTabIdx > 0 && (
              <button onClick={() => setActiveTab(formTabs[currentTabIdx - 1])} title="Back" style={navBtnStyle}>←</button>
            )}
            {currentTabIdx < formTabs.length - 1 && (
              <button onClick={() => setActiveTab(formTabs[currentTabIdx + 1])} title="Next" style={navBtnStyle}>→</button>
            )}
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleSave} style={{ padding: "9px 18px", background: "var(--fire)", color: "white", borderRadius: "var(--r-full)", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap" }}>
              {isExistingRecipe ? "Save Changes" : "Add Recipe"}
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
