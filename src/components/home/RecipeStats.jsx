import { useState, useEffect } from "react";
import { CATEGORY_OPTIONS, CARD_COLORS, allIngredients, formatTime } from "../../models/recipe";

// "Your Recipe Stats" — a glance at the whole cookbook, sat below the Recent
// carousel. Reuses the site's display numerals, fire accent and warm card
// colours; the category bars animate in on mount.
export function RecipeStats({ recipes }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const reduce = typeof window !== "undefined"
      && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(true); return undefined; }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!recipes.length) return null;

  // ── Aggregates ──────────────────────────────────────────────────────────────
  const rated         = recipes.filter(r => r.rating > 0);
  const avgRating     = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0;
  const totalMinutes  = recipes.reduce((s, r) => s + (r.prepTime || 0) + (r.cookTime || 0), 0);
  const ingredientCnt = recipes.reduce((s, r) => s + allIngredients(r).length, 0);

  // Category distribution, richest first. Each category keeps a stable warm
  // colour from the recipe-card palette.
  const categories = CATEGORY_OPTIONS
    .map((c, i) => ({
      name:  c.name,
      emoji: c.emoji,
      color: CARD_COLORS[i % CARD_COLORS.length],
      count: recipes.filter(r => r.category === c.name).length,
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...categories.map(c => c.count), 1);

  const highlights = [
    { value: avgRating ? avgRating.toFixed(1) : "—", label: "Avg rating",     star: true },
    { value: formatTime(totalMinutes, 0),            label: "In the kitchen"             },
    { value: String(ingredientCnt),                  label: "Ingredients"                },
  ];

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>
        Your Recipe Stats
      </h2>

      <div style={{
        background: "var(--card-bg)", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-card)",
        padding: "20px 20px 22px",
      }}>
        {/* Highlight figures */}
        <div style={{ display: "flex" }}>
          {highlights.map((h, i) => (
            <div key={h.label} style={{
              flex: 1, textAlign: "center", padding: "0 6px",
              borderRight: i < highlights.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700,
                color: "var(--ink)", lineHeight: 1, whiteSpace: "nowrap",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
              }}>
                {h.star && <span style={{ color: "var(--fire)", fontSize: 17 }}>★</span>}
                {h.value}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 7, fontWeight: 500 }}>
                {h.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: "var(--border)", margin: "20px 0 18px" }} />

        {/* Category breakdown */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
            By category
          </span>
          <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{recipes.length} recipes</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {categories.map((c, i) => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 15, width: 18, textAlign: "center", flexShrink: 0 }}>{c.emoji}</span>
              <span style={{ fontSize: 12.5, color: "var(--ink-soft)", width: 76, flexShrink: 0 }}>{c.name}</span>
              <div style={{ flex: 1, height: 8, background: "var(--surface)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 999, background: c.color,
                  width: shown ? `${(c.count / maxCount) * 100}%` : 0,
                  transition: "width 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                  transitionDelay: `${i * 70}ms`,
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", width: 14, textAlign: "right", flexShrink: 0 }}>
                {c.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
