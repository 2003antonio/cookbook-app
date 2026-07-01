import { Field } from "../../ui/Field";
import { PART_ICONS } from "../../../models/recipe";

// ── Parts tab (multi-part recipes only) ───────────────────────────────────────
// Lets the user name/reorder/remove parts and jump to that part's
// ingredients/steps.
export function PartsTab({
  parts, updatePart, addPart, removePart, movePart,
  bannerDismissed, setBannerDismissed,
  iconPickerFor, setIconPickerFor, iconPickerRef,
  countIngs, countSteps,
  setActivePartIdx, setActiveTab,
  inputStyle,
}) {
  return (
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
        {parts.map((part, idx) => {
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
                  <button onClick={() => movePart(idx, 1)} disabled={idx === parts.length - 1}
                    style={{ fontSize: 10, color: "var(--ink-faint)", opacity: idx === parts.length - 1 ? 0.25 : 1, lineHeight: 1 }}>▼</button>
                </div>

                <button onClick={() => removePart(part.id)} disabled={parts.length <= 2}
                  style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface)", color: "var(--ink-soft)", fontSize: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: parts.length <= 2 ? 0.3 : 1 }}>✕</button>
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
  );
}
