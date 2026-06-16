import { useState } from "react";
import { useRecipes, useShoppingList } from "./useRecipes";
import { RecipeForm } from "./components.jsx";
import HomeScreen from "./HomeScreen.jsx";
import RecipesScreen from "./RecipesScreen.jsx";
import ShoppingScreen from "./ShoppingScreen.jsx";
import "./tokens.css";

// ── Bottom Nav ────────────────────────────────────────────────────────────────
function BottomNav({ active, onChange, shoppingCount }) {
  const tabs = [
    { id: "home", label: "Home", icon: "⌂" },
    { id: "recipes", label: "Recipes", icon: "📖" },
    { id: "shopping", label: "Shopping", icon: "🛒", badge: shoppingCount },
  ];

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      height: "var(--nav-h)", background: "white",
      borderTop: "1px solid var(--border)",
      display: "flex", alignItems: "stretch",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      zIndex: 80,
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 3,
            color: active === tab.id ? "var(--fire)" : "var(--ink-faint)",
            transition: "color 0.15s", position: "relative",
          }}
        >
          {/* Active indicator */}
          {active === tab.id && (
            <div style={{
              position: "absolute", top: 0, left: "25%", right: "25%",
              height: 2.5, background: "var(--fire)", borderRadius: "0 0 3px 3px",
            }} />
          )}

          <div style={{ position: "relative" }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{tab.icon}</span>
            {tab.badge > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -8,
                minWidth: 16, height: 16, borderRadius: 999,
                background: "var(--fire)", color: "white",
                fontSize: 9.5, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px",
              }}>{tab.badge}</span>
            )}
          </div>
          <span style={{ fontSize: 10.5, fontWeight: active === tab.id ? 600 : 400, letterSpacing: "0.01em" }}>
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe, toggleFavorite } = useRecipes();
  const { items: shoppingItems, addItem, toggleItem, removeItem, clearChecked, addFromRecipe } = useShoppingList();

  const [tab, setTab] = useState("home");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [formState, setFormState] = useState(null); // null | "new" | recipe

  const handleSave = (data) => {
    if (formState === "new") {
      const created = addRecipe(data);
      setSelectedRecipe(created);
      setTab("recipes");
    } else {
      updateRecipe(formState.id, data);
      setSelectedRecipe(prev => prev ? { ...prev, ...data } : prev);
    }
    setFormState(null);
  };

  const handleDelete = (id) => {
    deleteRecipe(id);
    if (selectedRecipe?.id === id) setSelectedRecipe(null);
  };

  const handleSelectRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setTab("recipes");
  };

  const handleAddToShopping = (recipe) => {
    addFromRecipe(recipe);
    // Brief switch hint — keep user on recipe tab
  };

  const uncheckedCount = shoppingItems.filter(i => !i.checked).length;

  return (
    <div style={{
      height: "100dvh", display: "flex", flexDirection: "column",
      background: "var(--paper)", overflow: "hidden", position: "relative",
    }}>
      {/* Screen area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>

        {tab === "home" && (
          <HomeScreen
            recipes={recipes}
            onSelectRecipe={handleSelectRecipe}
            onNewRecipe={() => setFormState("new")}
          />
        )}

        {tab === "recipes" && (
          <RecipesScreen
            recipes={recipes}
            onSelectRecipe={setSelectedRecipe}
            selectedRecipe={selectedRecipe}
            onCloseDetail={() => setSelectedRecipe(null)}
            onEdit={(r) => setFormState(r)}
            onDelete={handleDelete}
            onToggleFavorite={toggleFavorite}
            onAddToShopping={handleAddToShopping}
            onNewRecipe={() => setFormState("new")}
          />
        )}

        {tab === "shopping" && (
          <ShoppingScreen
            items={shoppingItems}
            onAdd={addItem}
            onToggle={toggleItem}
            onRemove={removeItem}
            onClearChecked={clearChecked}
            recipes={recipes}
            onAddFromRecipe={handleAddToShopping}
          />
        )}
      </div>

      {/* Bottom nav */}
      <BottomNav active={tab} onChange={(t) => { setTab(t); if (t !== "recipes") setSelectedRecipe(null); }} shoppingCount={uncheckedCount} />

      {/* Form modal */}
      {formState !== null && (
        <RecipeForm
          initial={formState === "new" ? null : formState}
          onSave={handleSave}
          onCancel={() => setFormState(null)}
        />
      )}
    </div>
  );
}