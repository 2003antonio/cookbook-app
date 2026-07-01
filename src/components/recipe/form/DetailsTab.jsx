import { StarRating } from "../../ui/StarRating";
import { Field }      from "../../ui/Field";
import { CATEGORY_OPTIONS, CARD_COLORS, hexToRgba } from "../../../models/recipe";

// Overlay buttons on the cover-photo preview (readable over any image).
const imgActionBtn = {
  padding: "5px 11px", borderRadius: 999, fontSize: 12, fontWeight: 600,
  background: "rgba(0,0,0,0.55)", color: "white", backdropFilter: "blur(4px)",
};

// ── Details tab ───────────────────────────────────────────────────────────────
// Cover photo, name, category, prep/cook/servings, rating, card color, tags.
export function DetailsTab({
  form, set, errors, setErrors,
  categoryOpen, setCategoryOpen, categoryRef,
  imageInputRef, imageBusy, imageError, setImageError, handleImagePick,
  tagInput, setTagInput, addTag, removeTag,
  dragTagIdx, setDragTagIdx, moveTag,
  inputStyle,
}) {
  return (
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
        {imageError && <span style={{ fontSize: 11.5, color: "var(--error)" }}>{imageError}</span>}
      </Field>

      <Field label="Recipe name *">
        <input
          style={inputStyle(errors.name)} value={form.name}
          onChange={e => { set("name", e.target.value); if (errors.name) setErrors({}); }}
          placeholder="e.g. Chef P's Sushi Bake"
        />
        {errors.name && <span style={{ fontSize: 11.5, color: "var(--error)" }}>{errors.name}</span>}
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
  );
}
