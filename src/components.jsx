import { useState, useRef, useEffect } from "react";
import {
  UNITS, CATEGORY_OPTIONS, CARD_COLORS,
  formatIngredient, formatTime, newIngredient,
} from "./useRecipes";

// ── Toast notifications ─────────────────────────────────────────────────────
// Tiny pub-sub so any component (form, detail sheet, etc.) can fire a toast
// without needing toast state threaded through props. Mount <ToastHost />
// once near the root of the app (outside the modal/sheet so it survives
// them closing) and call showToast("message") from anywhere.
let toastListeners = [];
export function showToast(message) {
  toastListeners.forEach(fn => fn(message));
}
function subscribeToast(fn) {
  toastListeners = [...toastListeners, fn];
  return () => { toastListeners = toastListeners.filter(l => l !== fn); };
}

const TOAST_VISIBLE_MS = 2400;
const TOAST_EXIT_MS = 220;

export function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => subscribeToast((message) => {
    const id = genId("toast");
    setToasts(t => [...t, { id, message, leaving: false }]);
    setTimeout(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, leaving: true } : x));
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), TOAST_EXIT_MS);
    }, TOAST_VISIBLE_MS);
  }), []);

  if (!toasts.length) return null;

  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      zIndex: 999, display: "flex", flexDirection: "column-reverse", gap: 8,
      alignItems: "center", pointerEvents: "none",
    }}>
      <style>{`
        @keyframes toastIn { from { opacity: 0; transform: translateY(10px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes toastOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(6px) scale(0.96); } }
      `}</style>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--ink)", color: "white",
          padding: "10px 18px 10px 12px", borderRadius: "var(--r-full)",
          boxShadow: "var(--shadow-lg)", fontSize: 13.5, fontWeight: 500,
          whiteSpace: "nowrap",
          animation: `${t.leaving ? "toastOut" : "toastIn"} ${t.leaving ? TOAST_EXIT_MS : 220}ms ease forwards`,
        }}>
          <span style={{
            width: 20, height: 20, borderRadius: "50%", background: "#22c55e", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
              <path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Step / sub-step helpers ─────────────────────────────────────────────────
// Steps now support parts: Step 1, 1a, 1b, 1c, Step 2, 2a, 2b …
// Shape: { id, text, substeps: [{ id, text }] }
function genId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function newStep() {
  return { id: genId("step"), text: "", substeps: [] };
}
function newSubstep() {
  return { id: genId("sub"), text: "" };
}
// a, b, c … z, then a safety fallback past 26 sub-steps
function subLetter(idx) {
  return idx < 26 ? String.fromCharCode(97 + idx) : `s${idx + 1}`;
}
// Accepts legacy flat-string steps, legacy string sub-steps, or the current
// { id, text, substeps } shape — always returns the latter (ids filled in
// where missing) so the form can edit any previously-saved recipe.
function normalizeSteps(steps) {
  if (!steps || !steps.length) return [newStep()];
  return steps.map(s => {
    if (typeof s === "string") return { id: genId("step"), text: s, substeps: [] };
    return {
      id: s.id || genId("step"),
      text: s.text || "",
      substeps: (s.substeps || []).map(sub =>
        typeof sub === "string"
          ? { id: genId("sub"), text: sub }
          : { id: sub.id || genId("sub"), text: sub.text || "" }
      ),
    };
  });
}
// Read-only flattening for display — tolerates the same legacy shapes.
function stepsForDisplay(steps) {
  return (steps || [])
    .map(s => typeof s === "string"
      ? { text: s, substeps: [] }
      : { text: s.text || "", substeps: (s.substeps || []).map(sub => typeof sub === "string" ? sub : (sub.text || "")) })
    .filter(s => s.text || s.substeps.some(t => t));
}

// ── Star Rating ───────────────────────────────────────────────────────────────
export function StarRating({ rating, interactive = false, onChange, size = "md" }) {
  const [hover, setHover] = useState(0);
  const sz = size === "sm" ? "12px" : size === "lg" ? "20px" : "15px";
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          style={{
            fontSize: sz,
            color: s <= (interactive ? hover || rating : rating) ? "#E8621A" : "#D4D4D0",
            cursor: interactive ? "pointer" : "default",
            transition: "color 0.1s",
            userSelect: "none",
          }}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange?.(s)}
        >★</span>
      ))}
    </div>
  );
}

// ── Recipe Detail Sheet (SHOWING) ───────────────────────────────────────────────────────
export function RecipeDetail({ recipe, onClose, onEdit, onDelete, onToggleFavorite, onAddToShopping }) {
  const [activeTab, setActiveTab] = useState("ingredients");
  const [servings, setServings] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [isFavorite, setIsFavorite] = useState(recipe?.favorite ?? false);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const lastRecipeId = useRef(recipe?.id);

  // Sync local state when a different recipe is opened
  if (recipe?.id !== lastRecipeId.current) {
    lastRecipeId.current = recipe?.id;
    setIsFavorite(recipe?.favorite ?? false);
    setCheckedIngredients({});
  }

  if (!recipe) return null;

  const currentServings = servings ?? recipe.baseServings ?? 4;
  const multiplier = currentServings / (recipe.baseServings || 1);

  const handleToggleFavorite = () => {
    setIsFavorite(f => !f);
    onToggleFavorite(recipe.id);
  };

  const handleClose = () => { setServings(null); setConfirmDelete(false); setCheckedIngredients({}); onClose(); };

  const handleAddToShopping = () => {
    onAddToShopping(recipe);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const toggleIngredient = (id) => {
    setCheckedIngredients(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const tabs = ["ingredients", "steps", ...(recipe.notes ? ["notes"] : [])];

  // Parse notes: split by newline, filter empty lines
  const noteLines = recipe.notes
    ? recipe.notes.split("\n").map(l => l.trim()).filter(Boolean)
    : [];

  const ingredients = recipe.ingredients || [];
  const checkedCount = ingredients.filter(ing => checkedIngredients[ing.id]).length;
  const totalCount = ingredients.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Hero */}
      <div style={{
        background: recipe.color,
        padding: "48px 24px 28px",
        position: "relative",
        flexShrink: 0,
      }}>
        {/* Top actions */}
        <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
          <HeroBtn onClick={handleToggleFavorite} title={isFavorite ? "Unfavorite" : "Favorite"}>
            {isFavorite ? "♥" : "♡"}
          </HeroBtn>
          <HeroBtn onClick={() => { onClose(); setTimeout(() => onEdit(recipe), 50); }} title="Edit">✏️</HeroBtn>
          <HeroBtn onClick={handleClose} title="Close">✕</HeroBtn>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
          {recipe.category}
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "white", lineHeight: 1.15, marginBottom: 10, textShadow: "0 1px 6px rgba(0,0,0,0.18)" }}>
          {recipe.name}
        </h2>
        <StarRating rating={recipe.rating || 0} />
      </div>

      {/* Info row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--border)" }}>
        {[
          { label: "Prep", val: recipe.prepTime ? `${recipe.prepTime}m` : "—" },
          { label: "Cook", val: recipe.cookTime ? `${recipe.cookTime}m` : "—" },
          { label: "Total", val: formatTime(recipe.prepTime, recipe.cookTime) },
          {
            label: "Servings",
            customRender: () => (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 999, overflow: "hidden", background: "white" }}>
                  <button style={{ width: 32, height: 32, fontSize: 18, color: "var(--fire)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer" }}
                    onClick={() => setServings(Math.max(1, currentServings - 1))}>−</button>
                  <span style={{ width: 32, textAlign: "center", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{currentServings}</span>
                  <button style={{ width: 32, height: 32, fontSize: 18, color: "var(--fire)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer" }}
                    onClick={() => setServings(currentServings + 1)}>+</button>
                </div>
                {multiplier !== 1 && (
                  <button style={{
                    fontSize: 12, color: "var(--fire)", textDecoration: "underline",
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                    position: "absolute", bottom: -18, left: "50%", transform: "translateX(-50%)",
                    whiteSpace: "nowrap"
                  }}
                    onClick={() => setServings(null)}>reset</button>
                )}
              </div>
            )
          }
        ].map((p, i, arr) => (
          <div key={p.label} style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center",
            padding: "14px 8px 20px",
            gap: 3,
            borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
            background: p.label === "Servings" ? "var(--surface)" : "none",
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-faint)" }}>{p.label}</span>
            {p.customRender ? p.customRender() : <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{p.val}</span>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid var(--border)",
        padding: "0 20px",
        gap: "12px"
      }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1,
            textAlign: "center",
            padding: "12px 14px", fontSize: 13.5, fontWeight: 500,
            color: activeTab === tab ? "var(--fire)" : "var(--ink-soft)",
            borderBottom: activeTab === tab ? "2px solid var(--fire)" : "2px solid transparent",
            marginBottom: -1, textTransform: "capitalize", transition: "color 0.15s",
          }}>{tab}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>

        {/* ── Ingredients checklist ── */}
        {activeTab === "ingredients" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-faint)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {checkedCount} of {totalCount} ready
                </span>
                {checkedCount === totalCount && (
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "#22c55e" }}>All set! ✓</span>
                )}
              </div>
              <div style={{ height: 4, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 999,
                  background: checkedCount === totalCount ? "#22c55e" : "var(--fire)",
                  width: `${(checkedCount / totalCount) * 100}%`,
                  transition: "width 0.3s ease, background 0.3s ease",
                }} />
              </div>
            </div>

            {/* Checklist rows */}
            <ul style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[...ingredients]
                .sort((a, b) => {
                  const aChecked = !!checkedIngredients[a.id];
                  const bChecked = !!checkedIngredients[b.id];

                  // unchecked first, checked last
                  if (aChecked === bChecked) return 0;
                  return aChecked ? 1 : -1;
                })
                .map(ing => {
                  const checked = !!checkedIngredients[ing.id];

                  return (
                    <li
                      key={ing.id}
                      onClick={() => toggleIngredient(ing.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "9px 10px", borderRadius: "var(--r-sm)",
                        cursor: "pointer", transition: "background 0.12s",
                        background: checked ? "var(--surface)" : "transparent",
                        userSelect: "none",
                      }}
                      onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "var(--surface)"; }}
                      onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "transparent"; }}
                    >
                      {/* checkbox */}
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        border: checked ? "none" : "2px solid var(--border)",
                        background: checked ? "var(--fire)" : "white",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s ease",
                        boxShadow: checked ? "0 1px 4px rgba(232,98,26,0.3)" : "none",
                      }}>
                        {checked && (
                          <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                            <path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      <span style={{
                        fontSize: 13.5,
                        color: checked ? "var(--ink-faint)" : "var(--ink)",
                        lineHeight: 1.4, flex: 1,
                        textDecoration: checked ? "line-through" : "none",
                        transition: "color 0.15s",
                      }}>
                        {formatIngredient(ing, multiplier)}
                      </span>
                    </li>
                  );
                })}
            </ul>

            {/* Clear all */}
            {checkedCount > 0 && (
              <button
                onClick={() => setCheckedIngredients({})}
                style={{
                  alignSelf: "flex-start", fontSize: 12.5, color: "var(--ink-faint)",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                  textDecoration: "underline",
                }}
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {activeTab === "steps" && (
          <ol style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {stepsForDisplay(recipe.steps).map((step, i) => (
              <li key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "var(--fire-dim)", color: "var(--fire)",
                    fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>{i + 1}</span>
                  {step.text && (
                    <p style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55, paddingTop: 2 }}>{step.text}</p>
                  )}
                </div>
                {step.substeps.length > 0 && (
                  <ul style={{
                    display: "flex", flexDirection: "column", gap: 10,
                    marginLeft: 12, paddingLeft: 16, borderLeft: "2px solid var(--border)",
                  }}>
                    {step.substeps.map((subText, j) => (
                      <li key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: "white", border: "1.5px solid var(--fire-dim)", color: "var(--fire)",
                          fontSize: 11, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>{i + 1}{subLetter(j)}</span>
                        <p style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55, paddingTop: 1 }}>{subText}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}

        {activeTab === "notes" && (
          <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {noteLines.map((line, i) => (
              <li key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                fontSize: 13.5, color: "var(--ink)", lineHeight: 1.6,
              }}>
                <span style={{
                  marginTop: 6, width: 6, height: 6, borderRadius: "50%",
                  background: "var(--fire)", flexShrink: 0,
                }} />
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ padding: "14px 20px 40px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={handleAddToShopping}
          style={{
            width: "100%", padding: "8px", borderRadius: "var(--r-md)",
            background: addedToast ? "#22c55e" : "var(--fire)", color: "white",
            fontSize: 13.5, fontWeight: 600, transition: "background 0.3s",
          }}
        >
          {addedToast ? "✓ Added to shopping list!" : "🛒 Add ingredients to shopping list"}
        </button>

        {confirmDelete ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => {
              const deletedName = recipe.name;
              onDelete(recipe.id);
              handleClose();
              showToast(`"${deletedName}" successfully deleted`);
            }}
              style={{ flex: 1, padding: "5.5px", background: "#ef4444", color: "white", borderRadius: "var(--r-sm)", fontSize: 13, fontWeight: 600 }}>
              Yes, delete
            </button>
            <button onClick={() => setConfirmDelete(false)}
              style={{ flex: 1, padding: "5.5px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", fontSize: 13, color: "var(--ink-soft)" }}>
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            style={{
              padding: "5px", fontSize: 13.5, fontWeight: 500,
              color: "#ef4444", background: "#fef2f2",
              border: "1px solid #fee2e2", borderRadius: "var(--r-md)",
              cursor: "pointer", transition: "all 0.15s ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#fee2e2";
              e.currentTarget.style.borderColor = "#fca5a5";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "#fef2f2";
              e.currentTarget.style.borderColor = "#fee2e2";
            }}>
            🗑 Delete recipe
          </button>
        )}
      </div>
    </div>
  );
}

function HeroBtn({ children, onClick, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 34, height: 34, borderRadius: "50%",
      background: "rgba(255,255,255,0.22)", backdropFilter: "blur(4px)",
      color: "white", fontSize: 14,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "background 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.38)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
    >{children}</button>
  );
}

// ── Fraction / decimal parser ─────────────────────────────────────────────────
function parseAmount(val) {
  if (val === "" || val == null) return 0;
  const str = String(val).trim();
  // "1 1/2"
  const mixed = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  // "1/2"
  const frac = str.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  return parseFloat(str) || 0;
}

// ── Recipe Form  (EDITING) ───────────────────────────────────────────────────────────────
const FORM_TABS = ["details", "ingredients", "steps", "notes"];

const BLANK = {
  name: "", category: "Main Dish", prepTime: "", cookTime: "",
  baseServings: 4, color: CARD_COLORS[0], rating: 0,
  tags: [], notes: "", ingredients: [newIngredient(), newIngredient(), newIngredient(), newIngredient()],
  steps: [newStep(), newStep(), newStep()],
};

export function RecipeForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() =>
    initial ? {
      ...initial, tags: initial.tags || [], steps: normalizeSteps(initial.steps),
      ingredients: initial.ingredients?.length ? initial.ingredients : [newIngredient()],
    } : BLANK
  );
  const [activeTab, setActiveTab] = useState("details");
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setIng = (id, k, v) => set("ingredients", form.ingredients.map(i => i.id === id ? { ...i, [k]: v } : i));
  const addIng = () => set("ingredients", [...form.ingredients, newIngredient()]);
  const removeIng = (id) => set("ingredients", form.ingredients.filter(i => i.id !== id));
  const setStepText = (stepId, val) =>
    set("steps", form.steps.map(s => s.id === stepId ? { ...s, text: val } : s));
  const addStep = () => set("steps", [...form.steps, newStep()]);
  const removeStep = (stepId) => set("steps", form.steps.filter(s => s.id !== stepId));

  const addSubstep = (stepId) =>
    set("steps", form.steps.map(s => s.id === stepId ? { ...s, substeps: [...s.substeps, newSubstep()] } : s));
  const setSubstepText = (stepId, subId, val) =>
    set("steps", form.steps.map(s => s.id === stepId
      ? { ...s, substeps: s.substeps.map(sub => sub.id === subId ? { ...sub, text: val } : sub) }
      : s));
  const removeSubstep = (stepId, subId) =>
    set("steps", form.steps.map(s => s.id === stepId
      ? { ...s, substeps: s.substeps.filter(sub => sub.id !== subId) }
      : s));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  };
  const removeTag = (t) => set("tags", form.tags.filter(x => x !== t));

  const handleSave = () => {
    const e = {};
    if (!form.name.trim()) { e.name = "Name is required"; setActiveTab("details"); }
    if (Object.keys(e).length) { setErrors(e); return; }
    const cleanSteps = form.steps
      .map(s => ({
        id: s.id,
        text: s.text.trim(),
        substeps: s.substeps
          .map(sub => ({ id: sub.id, text: sub.text.trim() }))
          .filter(sub => sub.text),
      }))
      .filter(s => s.text || s.substeps.length > 0);
    const recipeName = form.name.trim();
    onSave({
      ...form,
      prepTime: Number(form.prepTime) || 0,
      cookTime: Number(form.cookTime) || 0,
      baseServings: Number(form.baseServings) || 4,
      ingredients: form.ingredients
        .filter(i => i.name.trim())
        .map(i => ({ ...i, amount: parseAmount(i.amount) })),
      steps: cleanSteps,
    });
    showToast(`${recipeName} has been successfully ${initial ? "saved" : "created"}`);
  };

  const inputStyle = (err) => ({
    padding: "9px 12px", border: `1.5px solid ${err ? "#ef4444" : "var(--border)"}`,
    borderRadius: "var(--r-sm)", fontSize: 14, color: "var(--ink)", background: "white",
    outline: "none", width: "100%", transition: "border-color 0.15s",
  });

  // Counts for tab badges
  const ingCount = form.ingredients.filter(i => i.name.trim()).length;
  const stepCount = form.steps.reduce((acc, s) =>
    acc + (s.text.trim() ? 1 : 0) + s.substeps.filter(sub => sub.text.trim()).length, 0);
  const noteLineCount = form.notes.split("\n").filter(l => l.trim()).length;

  const tabLabel = (tab) => {
    if (tab === "ingredients" && ingCount > 0) return `Ingredients (${ingCount})`;
    if (tab === "steps" && stepCount > 0) return `Steps (${stepCount})`;
    if (tab === "notes" && noteLineCount > 0) return `Notes (${noteLineCount})`;
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  const currentTabIdx = FORM_TABS.indexOf(activeTab);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      backdropFilter: "blur(3px)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{
        background: "white", borderRadius: "var(--r-lg)", width: "100%",
        maxWidth: 620, maxHeight: "90vh", display: "flex", flexDirection: "column",
        boxShadow: "var(--shadow-lg)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 0", borderTop: `4px solid ${form.color}`, flexShrink: 0,
        }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>
            {initial ? "Edit Recipe" : "New Recipe"}
          </h2>
          <button onClick={onCancel} style={{
            width: 30, height: 30, borderRadius: "50%", background: "var(--surface)",
            fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Form Tabs */}
        <div style={{
          display: "flex", borderBottom: "1px solid var(--border)",
          padding: "0 24px", gap: 4, flexShrink: 0, overflowX: "auto",
        }}>
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

          {/* ── Details tab ── */}
          {activeTab === "details" && (
            <>
              <Field label="Recipe name *">
                <input style={inputStyle(errors.name)} value={form.name}
                  onChange={e => { set("name", e.target.value); if (errors.name) setErrors({}); }}
                  placeholder="e.g. Grandma's Apple Pie" />
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
                      }} onMouseEnter={e => e.target.style.transform = "scale(1.2)"}
                        onMouseLeave={e => e.target.style.transform = "scale(1)"} />
                    ))}
                  </div>
                </Field>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { label: "Prep (min)", key: "prepTime", ph: "15" },
                  { label: "Cook (min)", key: "cookTime", ph: "30" },
                  { label: "Servings", key: "baseServings", ph: "4" },
                ].map(f => (
                  <Field key={f.key} label={f.label} style={{ flex: 1 }}>
                    <input style={inputStyle()} type="number" min="0" value={form[f.key]}
                      onChange={e => set(f.key, e.target.value)} placeholder={f.ph} />
                  </Field>
                ))}
              </div>

              <Field label="Rating">
                <StarRating rating={form.rating} interactive onChange={r => set("rating", r)} />
              </Field>

              <Field label="Tags">
                <div style={{ display: "flex", gap: 8 }}>
                  <input style={{ ...inputStyle(), flex: 1 }} value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addTag()}
                    placeholder="e.g. Italian, Quick…" />
                  <button onClick={addTag} style={{
                    padding: "9px 16px", background: "var(--surface)", border: "1.5px solid var(--border)",
                    borderRadius: "var(--r-sm)", fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap",
                  }}>Add</button>
                </div>
                {form.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {form.tags.map(t => (
                      <span key={t} style={{
                        display: "flex", alignItems: "center", gap: 4, padding: "3px 10px",
                        background: "var(--fire-dim)", color: "var(--fire)",
                        borderRadius: 999, fontSize: 12.5, fontWeight: 500,
                      }}>
                        {t}
                        <button onClick={() => removeTag(t)} style={{ fontSize: 10, color: "var(--fire)", opacity: 0.6 }}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>
            </>
          )}

          {/* ── Ingredients tab ── */}
          {activeTab === "ingredients" && (
            <Field label="Ingredients">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {form.ingredients.map(ing => (
                  <div key={ing.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {/* text input supports fractions (1/2, 1 1/2) and decimals (0.75) */}
                    <input
                      style={{ ...inputStyle(), width: 64 }}
                      type="text"
                      inputMode="decimal"
                      value={ing.amount}
                      onChange={e => setIng(ing.id, "amount", e.target.value)}
                      placeholder="1"
                    />
                    <select style={{ ...inputStyle(), width: 80, cursor: "pointer" }} value={ing.unit} onChange={e => setIng(ing.id, "unit", e.target.value)}>
                      {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                    <input style={{ ...inputStyle(), flex: 1 }} value={ing.name}
                      onChange={e => setIng(ing.id, "name", e.target.value)} placeholder="ingredient" />
                    <button onClick={() => removeIng(ing.id)} disabled={form.ingredients.length === 1}
                      style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface)", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", opacity: form.ingredients.length === 1 ? 0.3 : 1 }}>✕</button>
                  </div>
                ))}
                <button onClick={addIng} style={{ fontSize: 13, color: "var(--fire)", fontWeight: 500, textAlign: "left", padding: "4px 0" }}>+ Add ingredient</button>
              </div>
            </Field>
          )}

          {/* ── Steps tab ── */}
          {activeTab === "steps" && (
            <Field label="Steps">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {form.steps.map((step, idx) => (
                  <div key={step.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* Main step row */}
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: "50%", background: "var(--fire-dim)",
                        color: "var(--fire)", fontSize: 12, fontWeight: 700, marginTop: 8, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{idx + 1}</span>
                      <textarea style={{ ...inputStyle(), resize: "vertical", lineHeight: 1.5, flex: 1 }}
                        value={step.text} onChange={e => setStepText(step.id, e.target.value)}
                        placeholder={`Step ${idx + 1}…`} rows={2} />
                      <button onClick={() => removeStep(step.id)} disabled={form.steps.length === 1}
                        style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface)", fontSize: 11, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", opacity: form.steps.length === 1 ? 0.3 : 1 }}>✕</button>
                    </div>

                    {/* Sub-steps (1a, 1b, 1c …) */}
                    {step.substeps.length > 0 && (
                      <div style={{
                        display: "flex", flexDirection: "column", gap: 6,
                        marginLeft: 12, paddingLeft: 16, borderLeft: "2px solid var(--border)",
                      }}>
                        {step.substeps.map((sub, subIdx) => (
                          <div key={sub.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <span style={{
                              width: 22, height: 22, borderRadius: "50%", background: "white",
                              border: "1.5px solid var(--fire-dim)", color: "var(--fire)",
                              fontSize: 11, fontWeight: 700, marginTop: 7, flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>{subLetter(subIdx)}</span>
                            <textarea style={{ ...inputStyle(), resize: "vertical", lineHeight: 1.5, flex: 1 }}
                              value={sub.text} onChange={e => setSubstepText(step.id, sub.id, e.target.value)}
                              placeholder={`Step ${idx + 1}${subLetter(subIdx)}…`} rows={1} />
                            <button onClick={() => removeSubstep(step.id, sub.id)}
                              style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--surface)", fontSize: 10, marginTop: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button onClick={() => addSubstep(step.id)} style={{
                      fontSize: 12.5, color: "var(--ink-faint)", fontWeight: 500, textAlign: "left",
                      marginLeft: 32, padding: "2px 0",
                    }}>+ Add part ({step.substeps.length === 0 ? "a" : subLetter(step.substeps.length)})</button>
                  </div>
                ))}
                <button onClick={addStep} style={{ fontSize: 13, color: "var(--fire)", fontWeight: 500, textAlign: "left", padding: "4px 0" }}>+ Add step</button>
              </div>
            </Field>
          )}

          {/* ── Notes tab ── */}
          {activeTab === "notes" && (
            <Field label="Notes & tips">
              <p style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 4 }}>
                Each line will appear as a separate note. Press Enter to start a new one.
              </p>
              <textarea style={{ ...inputStyle(), resize: "vertical", lineHeight: 1.7, minHeight: 180 }}
                value={form.notes} onChange={e => set("notes", e.target.value)}
                placeholder={"Tip 1: use ripe bananas\nTip 2: can substitute oat milk\nKeep refrigerated for up to 3 days"}
                rows={8} />
              {/* Live preview */}
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
          {/* Back / Next — own row with borders above and below */}
          <div style={{
            borderBottom: "1px solid var(--border)",
            padding: "10px 24px",
            display: "flex", justifyContent: "center", gap: 8,
            background: "white",
          }}>
            {currentTabIdx > 0 && (
              <button onClick={() => setActiveTab(FORM_TABS[currentTabIdx - 1])} style={{
                padding: "7px 18px", background: "white", color: "var(--ink-soft)",
                borderRadius: "var(--r-full)", fontSize: 13, fontWeight: 500,
                border: "1.5px solid var(--border)",
              }}>← Back</button>
            )}
            {currentTabIdx < FORM_TABS.length - 1 && (
              <button onClick={() => setActiveTab(FORM_TABS[currentTabIdx + 1])} style={{
                padding: "7px 18px", background: "white", color: "var(--ink-soft)",
                borderRadius: "var(--r-full)", fontSize: 13, fontWeight: 500,
                border: "1.5px solid var(--border)",
              }}>Next →</button>
            )}
            {/* Keep row height consistent even when no nav buttons */}
            {currentTabIdx === 0 && currentTabIdx === FORM_TABS.length - 1 && (
              <span style={{ height: 34 }} />
            )}
          </div>

          {/* Add recipe — centered below */}
          <div style={{ padding: "16px 24px", display: "flex", justifyContent: "center" }}>
            <button onClick={handleSave} style={{
              padding: "11px 40px", background: "var(--fire)", color: "white",
              borderRadius: "var(--r-full)", fontSize: 14, fontWeight: 600,
              boxShadow: "var(--shadow-sm)",
            }}>{initial ? "Save changes" : "Add recipe"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <label style={{ fontSize: 11.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-faint)" }}>{label}</label>
      {children}
    </div>
  );
}