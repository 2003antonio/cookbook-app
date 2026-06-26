// ── RecipeTypeChooser ───────────────────────────────────────────────────────
// Shown when the user taps "New Recipe", before the full RecipeForm opens.
// Lets them pick a simple single-part recipe vs. a multi-part one, which
// determines how many components RecipeForm starts with.
export function RecipeTypeChooser({ onChooseSimple, onChooseMultiPart, onCancel }) {
  let _mouseDownOnBackdrop = false;

  const cardStyle = {
    flex: 1, background: "white", border: "1.5px solid var(--border)",
    borderRadius: "var(--r-lg)", padding: "20px 18px", display: "flex",
    flexDirection: "column", gap: 10, minWidth: 0,
  };

  const iconWrap = (bg) => ({
    width: 36, height: 36, borderRadius: "var(--r-sm)", background: bg,
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0,
  });

  const previewCardStyle = {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--r-sm)", padding: "10px 11px",
  };

  const skeletonLine = (width) => (
    <div style={{ height: 5, width, borderRadius: 3, background: "var(--border)" }} />
  );

  // Mini "My Recipe" mockup — heart icon, Ingredients/Steps lists.
  const SimplePreview = () => (
    <div style={previewCardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink-soft)" }}>My Recipe</span>
        <span style={{ fontSize: 10, color: "var(--ink-faint)" }}>♡</span>
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--fire)", marginBottom: 4 }}>Ingredients</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
        {["80%", "65%", "70%"].map((w, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 8, color: "var(--ink-faint)" }}>•</span>
            {skeletonLine(w)}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--fire)", marginBottom: 4 }}>Steps</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {["90%", "60%", "75%"].map((w, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 8, color: "var(--ink-faint)" }}>{i + 1}.</span>
            {skeletonLine(w)}
          </div>
        ))}
      </div>
    </div>
  );

  // Mini "My Multi-part Recipe" mockup — numbered part rows with icons.
  const MultiPartPreview = () => {
    const parts = [
      { label: "Part 1: Prep",   icon: "🍳", bg: "rgba(139,92,246,0.18)" },
      { label: "Part 2: Cook",   icon: "🍲", bg: "rgba(232,98,26,0.15)"  },
      { label: "Part 3: Finish", icon: "🍯", bg: "rgba(34,197,94,0.15)" },
    ];
    return (
      <div style={previewCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink-soft)" }}>My Multi-part Recipe</span>
          <span style={{ fontSize: 10, color: "var(--ink-faint)" }}>♡</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {parts.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "white", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 7px" }}>
              <span style={{
                width: 14, height: 14, borderRadius: "50%", background: p.bg, color: "var(--ink)",
                fontSize: 8, fontWeight: 700, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{i + 1}</span>
              <span style={{ fontSize: 9, color: "var(--ink-soft)", flex: 1 }}>{p.label}</span>
              <span style={{ fontSize: 11 }}>{p.icon}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
          background: "var(--paper)", borderRadius: "var(--r-lg)", width: "100%",
          maxWidth: 560, maxHeight: "90vh", overflowY: "auto",
          boxShadow: "var(--shadow-lg)", padding: "28px 28px 24px",
          display: "flex", flexDirection: "column", gap: 22,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", position: "relative" }}>
          <button
            onClick={onCancel}
            style={{
              position: "absolute", top: -4, right: -4, width: 30, height: 30, borderRadius: "50%",
              background: "var(--surface)", fontSize: 13, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 600 }}>
            Let's make a new recipe!
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: 4 }}>
            Choose how you'd like to start.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: "flex", gap: 14 }}>
          {/* Simple Recipe */}
          <div style={cardStyle}>
            <div style={iconWrap("var(--fire-dim)")}>📄</div>
            <div>
              <h3 style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 2 }}>Simple Recipe</h3>
              <p style={{ fontSize: 12, color: "var(--ink-faint)", lineHeight: 1.4 }}>
                A single recipe with ingredients and steps.
              </p>
            </div>
            <SimplePreview />
            <button
              onClick={onChooseSimple}
              style={{
                marginTop: "auto", padding: "9px 12px", background: "var(--fire-dim)",
                color: "var(--fire)", borderRadius: "var(--r-full)", fontSize: 13, fontWeight: 600,
              }}
            >
              Create Simple Recipe →
            </button>
          </div>

          {/* Multi-part Recipe */}
          <div style={cardStyle}>
            <div style={iconWrap("rgba(245,158,11,0.15)")}>📚</div>
            <div>
              <h3 style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 2 }}>Multi-part Recipe</h3>
              <p style={{ fontSize: 12, color: "var(--ink-faint)", lineHeight: 1.4 }}>
                A recipe with multiple parts or sections.
              </p>
            </div>
            <MultiPartPreview />
            <button
              onClick={onChooseMultiPart}
              style={{
                marginTop: "auto", padding: "9px 12px", background: "#f59e0b",
                color: "white", borderRadius: "var(--r-full)", fontSize: 13, fontWeight: 600,
              }}
            >
              Create Multi-part Recipe →
            </button>
          </div>
        </div>

        {/* Upload — not yet implemented */}
        <div
          title="Coming soon"
          style={{
            border: "1.5px dashed var(--border)", borderRadius: "var(--r-md)",
            padding: "14px 16px", textAlign: "center", color: "var(--ink-faint)",
            fontSize: 13, opacity: 0.6, cursor: "not-allowed",
          }}
        >
          ⬆ Or upload a recipe file
          <div style={{ fontSize: 11, marginTop: 2 }}>Coming soon</div>
        </div>
      </div>
    </div>
  );
}
