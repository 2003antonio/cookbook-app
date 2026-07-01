import { Field } from "../../ui/Field";

// ── Notes tab ─────────────────────────────────────────────────────────────────
// Free-text notes; each non-blank line renders as a separate bullet in the
// live preview below the textarea.
export function NotesTab({ notes, set, noteLineCount, inputStyle }) {
  return (
    <Field label="Notes & tips" style={{ flex: 1 }}>
      <p style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 4 }}>
        Master recipe notes. Each line will appear as a separate note.
      </p>
      <textarea
        style={{ ...inputStyle(), resize: "vertical", lineHeight: 1.7, flex: 1, minHeight: 120 }}
        value={notes} onChange={e => set("notes", e.target.value)}
        placeholder={"Tip 1: use room temperature butter\nTip 2: requires 24 hours advance preparation"}
        rows={8}
      />
      {noteLineCount > 0 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 11.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-faint)", marginBottom: 8 }}>Preview</p>
          <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notes.split("\n").filter(l => l.trim()).map((line, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5 }}>
                <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: "50%", background: "var(--fire)", flexShrink: 0 }} />
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Field>
  );
}
