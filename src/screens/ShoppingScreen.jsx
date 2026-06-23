import { useState, useRef } from "react";
import { allIngredients } from "../models/recipe";

// ── Shopping List Screen ──────────────────────────────────────────────────────
export default function ShoppingScreen({ items, onAdd, onToggle, onRemove, onClearChecked, recipes, onAddFromRecipe }) {
  const [input, setInput] = useState("");
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const inputRef = useRef(null);

  const handleAdd = () => {
    if (!input.trim()) return;
    onAdd(input);
    setInput("");
    inputRef.current?.focus();
  };

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

  // Group unchecked by recipe source
  const grouped = {};
  const ungrouped = [];
  unchecked.forEach(item => {
    if (item.fromRecipe) {
      grouped[item.fromRecipe] = grouped[item.fromRecipe] || [];
      grouped[item.fromRecipe].push(item);
    } else {
      ungrouped.push(item);
    }
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "24px 24px 16px", flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600 }}>Shopping List</h1>
          {checked.length > 0 && (
            <button onClick={onClearChecked} style={{
              fontSize: 12.5, color: "var(--fire)", fontWeight: 600, letterSpacing: "0.02em",
            }}>Clear done ({checked.length})</button>
          )}
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-faint)" }}>
          {unchecked.length} item{unchecked.length !== 1 ? "s" : ""} remaining
        </p>
      </div>

      {/* Add input */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0, display: "flex", gap: 10 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="Add an item…"
          style={{
            flex: 1, padding: "10px 14px",
            border: "1.5px solid var(--border)", borderRadius: "var(--r-full)",
            fontSize: 14, background: "var(--surface)", outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = "var(--fire)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
        <button onClick={handleAdd} style={{
          padding: "10px 18px", background: "var(--fire)", color: "white",
          borderRadius: "var(--r-full)", fontSize: 14, fontWeight: 600,
        }}>Add</button>
      </div>

      {/* Import from recipe button */}
      <div style={{ padding: "10px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <button onClick={() => setShowRecipePicker(p => !p)} style={{
          display: "flex", alignItems: "center", gap: 7,
          fontSize: 13.5, color: "var(--ink-soft)", fontWeight: 500,
          padding: "7px 12px", borderRadius: "var(--r-sm)",
          background: showRecipePicker ? "var(--fire-dim)" : "var(--surface)",
          border: "1.5px solid var(--border)", transition: "all 0.15s",
        }}>
          🍳 Import from recipe {showRecipePicker ? "▲" : "▼"}
        </button>

        {showRecipePicker && (
          <div style={{
            marginTop: 8, borderRadius: "var(--r-md)", border: "1.5px solid var(--border)",
            background: "white", boxShadow: "var(--shadow-md)", overflow: "hidden",
            maxHeight: 220, overflowY: "auto",
          }}>
            {recipes.length === 0 ? (
              <div style={{ padding: "16px", fontSize: 13, color: "var(--ink-faint)", textAlign: "center" }}>
                No recipes yet
              </div>
            ) : recipes.map(r => (
              <button key={r.id} onClick={() => { onAddFromRecipe(r); setShowRecipePicker(false); }} style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "12px 16px", textAlign: "left",
                borderBottom: "1px solid var(--border)", transition: "background 0.1s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
                onMouseLeave={e => e.currentTarget.style.background = "white"}
              >
                <div style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", background: r.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{r.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{allIngredients(r).length} ingredients</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "calc(var(--nav-h) + 16px)" }}>
        {items.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 24px", gap: 10, textAlign: "center" }}>
            <span style={{ fontSize: 44 }}>🛒</span>
            <p style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>Your list is empty</p>
            <p style={{ fontSize: 13, color: "var(--ink-faint)" }}>Add items above or import from a recipe</p>
          </div>
        ) : (
          <>
            {/* Ungrouped */}
            {ungrouped.length > 0 && (
              <div style={{ padding: "16px 24px 0" }}>
                {ungrouped.map(item => <ShopItem key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} />)}
              </div>
            )}

            {/* Grouped by recipe */}
            {Object.entries(grouped).map(([recipeName, groupItems]) => (
              <div key={recipeName} style={{ padding: "16px 24px 0" }}>
                <div style={{
                  fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--fire)", marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <div style={{ flex: 1, height: 1, background: "var(--fire-dim)" }} />
                  {recipeName}
                  <div style={{ flex: 1, height: 1, background: "var(--fire-dim)" }} />
                </div>
                {groupItems.map(item => <ShopItem key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} />)}
              </div>
            ))}

            {/* Checked section */}
            {checked.length > 0 && (
              <div style={{ padding: "20px 24px 0" }}>
                <div style={{
                  fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  Done
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>
                {checked.map(item => <ShopItem key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ShopItem({ item, onToggle, onRemove }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 0", borderBottom: "1px solid var(--border)",
    }}>
      {/* Checkbox */}
      <button onClick={() => onToggle(item.id)} style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        border: item.checked ? "none" : "2px solid var(--border)",
        background: item.checked ? "var(--fire)" : "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}>
        {item.checked && <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>}
      </button>

      <span style={{
        flex: 1, fontSize: 14.5, color: item.checked ? "var(--ink-faint)" : "var(--ink)",
        textDecoration: item.checked ? "line-through" : "none",
        transition: "color 0.15s",
      }}>{item.text}</span>

      <button onClick={() => onRemove(item.id)} style={{
        width: 26, height: 26, borderRadius: "50%",
        background: "none", color: "var(--ink-faint)", fontSize: 14,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s", opacity: 0.5,
      }}
        onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#ef4444"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "0.5"; e.currentTarget.style.color = "var(--ink-faint)"; }}
      >✕</button>
    </div>
  );
}
