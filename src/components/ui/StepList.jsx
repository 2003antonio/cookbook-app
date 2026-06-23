import { stepsForDisplay, subLetter } from "../../models/recipe";

// Shared between RecipeDetail and HomeScreen's read-only preview sheet
// so the two read-only views of a recipe's steps can't drift out of sync.
export function StepList({ steps }) {
  return (
    <ol style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {stepsForDisplay(steps).map((step, i) => (
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
  );
}
