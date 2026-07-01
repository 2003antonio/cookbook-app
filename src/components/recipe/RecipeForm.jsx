import { useState, useRef, useEffect, useMemo } from "react";
import { showToast }     from "../ui/ToastHost";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { IconButton }    from "../ui/IconButton";
import { ModalOverlay }  from "../ui/ModalOverlay";
import { DetailsTab }     from "./form/DetailsTab";
import { PartsTab }       from "./form/PartsTab";
import { IngredientsTab } from "./form/IngredientsTab";
import { StepsTab }       from "./form/StepsTab";
import { NotesTab }       from "./form/NotesTab";
import {
  CARD_COLORS,
  newIngredient, newStep, newSubstep, normalizeRecipe, newPart,
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

// ── RecipeForm ────────────────────────────────────────────────────────────────
// Owns all form state and the tab-routing chrome (header, tab bar, footer
// nav/save/delete); the per-tab body content lives in ./form/*Tab.jsx.
export function RecipeForm({ initial, onSave, onCancel, onDelete, recipes = [], isEntering = false }) {
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
    border: `1px solid ${err ? "var(--error)" : "var(--border)"}`,
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

  return (
    // Backdrop is rendered by App.js and stays alive across the whole
    // TypeChooser → loader → RecipeForm flow — this overlay stays transparent.
    <ModalOverlay onClose={attemptCancel} showBackdrop={false}>
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
          <IconButton
            onClick={attemptCancel} ariaLabel="Close"
            size={28} background="rgba(255,255,255,0.14)" hoverBackground="rgba(255,255,255,0.26)"
            color="white" fontSize={13}
          >✕</IconButton>
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

          {activeTab === "details" && (
            <DetailsTab
              form={form} set={set} errors={errors} setErrors={setErrors}
              categoryOpen={categoryOpen} setCategoryOpen={setCategoryOpen} categoryRef={categoryRef}
              imageInputRef={imageInputRef} imageBusy={imageBusy} imageError={imageError}
              setImageError={setImageError} handleImagePick={handleImagePick}
              tagInput={tagInput} setTagInput={setTagInput} addTag={addTag} removeTag={removeTag}
              dragTagIdx={dragTagIdx} setDragTagIdx={setDragTagIdx} moveTag={moveTag}
              inputStyle={inputStyle}
            />
          )}

          {activeTab === "parts" && (
            <PartsTab
              parts={form.parts} updatePart={updatePart} addPart={addPart}
              removePart={removePart} movePart={movePart}
              bannerDismissed={bannerDismissed} setBannerDismissed={setBannerDismissed}
              iconPickerFor={iconPickerFor} setIconPickerFor={setIconPickerFor} iconPickerRef={iconPickerRef}
              countIngs={countIngs} countSteps={countSteps}
              setActivePartIdx={setActivePartIdx} setActiveTab={setActiveTab}
              inputStyle={inputStyle}
            />
          )}

          {activeTab === "ingredients" && (
            <IngredientsTab
              multiPart={multiPart} parts={form.parts}
              activePart={activePart} activePartIdx={activePartIdx} onSelectPart={setActivePartIdx}
              activeIngredients={activeIngredients} setIng={setIng} addIng={addIng} removeIng={removeIng}
              inputStyle={inputStyle}
            />
          )}

          {activeTab === "steps" && (
            <StepsTab
              multiPart={multiPart} parts={form.parts}
              activePart={activePart} activePartIdx={activePartIdx} onSelectPart={setActivePartIdx}
              activeSteps={activeSteps} setStepText={setStepText} addStep={addStep} removeStep={removeStep}
              addSubstep={addSubstep} setSubstepText={setSubstepText} removeSubstep={removeSubstep}
              breakIntoParts={breakIntoParts}
              inputStyle={inputStyle}
            />
          )}

          {activeTab === "notes" && (
            <NotesTab notes={form.notes} set={set} noteLineCount={noteLineCount} inputStyle={inputStyle} />
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
              <IconButton onClick={() => setActiveTab(formTabs[currentTabIdx - 1])} title="Back" color="var(--ink-soft)" fontSize={15}>←</IconButton>
            )}
            {currentTabIdx < formTabs.length - 1 && (
              <IconButton onClick={() => setActiveTab(formTabs[currentTabIdx + 1])} title="Next" color="var(--ink-soft)" fontSize={15}>→</IconButton>
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
    </ModalOverlay>
  );
}
