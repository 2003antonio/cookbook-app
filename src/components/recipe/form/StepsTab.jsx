import { useRef, useLayoutEffect } from "react";
import { Field } from "../../ui/Field";
import { subLetter } from "../../../models/recipe";
import { PartSelector } from "./PartSelector";

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

// ── Steps tab ─────────────────────────────────────────────────────────────────
// Scoped to `activePart`, same as IngredientsTab. Steps support one level of
// sub-steps (1, 1a, 1b, 2, 2a…).
export function StepsTab({
  multiPart, parts, activePart, activePartIdx, onSelectPart,
  activeSteps, setStepText, addStep, removeStep, addSubstep, setSubstepText, removeSubstep,
  breakIntoParts,
  inputStyle,
}) {
  return (
    <Field label={multiPart ? `Steps — ${activePart?.name || `Part ${activePartIdx + 1}`}` : "Steps"} style={{ flex: 1 }}>
      {multiPart && <PartSelector parts={parts} activePartIdx={activePartIdx} onSelect={onSelectPart} />}
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
  );
}
