import { useState } from "react";
import { useRecipes, useShoppingList } from "./hooks/useRecipes";
import { RecipeForm }  from "./components/recipe/RecipeForm";
import { ToastHost }   from "./components/ui/ToastHost";
import HomeScreen      from "./screens/HomeScreen";
import RecipesScreen   from "./screens/RecipesScreen";
import ShoppingScreen  from "./screens/ShoppingScreen";
import { useAuth }     from "./hooks/useAuth";
import "./style/tokens.css";

// ── Bottom Nav ────────────────────────────────────────────────────────────────
const NAV_TABS = [
  { id: "home",     label: "Home",     icon: "⌂"  },
  { id: "recipes",  label: "Recipes",  icon: "📖" },
  { id: "shopping", label: "Shopping", icon: "🛒" },
];

function BottomNav({ active, onChange, shoppingCount }) {
  const tabs = NAV_TABS.map(tab =>
    tab.id === "shopping" ? { ...tab, badge: shoppingCount } : tab
  );

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
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const { recipes, addRecipe, updateRecipe, deleteRecipe, toggleFavorite } = useRecipes(userId);
  const { items: shoppingItems, addItem, toggleItem, removeItem, clearChecked, addFromRecipe } = useShoppingList(userId);

  const [tab,            setTab]            = useState("home");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [formState,      setFormState]      = useState(null);
  const [recipesFilter,  setRecipesFilter]  = useState("All");

  const handleSave = (data) => {
    if (formState === "new") {
      const created = addRecipe(data);
      setSelectedRecipe(created);
      setRecipesFilter("All");
      setTab("recipes");
    } else {
      const updated = { ...formState, ...data };
      updateRecipe(formState.id, data);
      setSelectedRecipe(updated);
    }
    setFormState(null);
  };

  const handleDelete = (id) => {
    deleteRecipe(id);
    if (selectedRecipe?.id === id) setSelectedRecipe(null);
  };

  // Navigate to Recipes tab with an optional filter ("All", "Favorites")
  const handleGoToRecipes = (filter = "All") => {
    setRecipesFilter(filter);
    setSelectedRecipe(null);
    setTab("recipes");
  };

  // Jump straight to a specific recipe's detail sheet on the Recipes tab
  // (used by Home's "Recent" row)
  const handleOpenRecipe = (recipe) => {
    setRecipesFilter("All");
    setSelectedRecipe(recipe);
    setTab("recipes");
  };

  const uncheckedCount = shoppingItems.filter(i => !i.checked).length;

  // True only while editing an existing recipe so the detail sheet underneath
  // can't be swiped away mid-edit.
  const isEditingRecipe = formState !== null && formState !== "new";

  return (
    <div style={{
      height: "100dvh", display: "flex", flexDirection: "column",
      background: "var(--paper)", overflow: "hidden", position: "relative",
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>

        {tab === "home" && (
          <HomeScreen
            recipes={recipes}
            onGoToRecipes={handleGoToRecipes}
            onOpenRecipe={handleOpenRecipe}
            onNewRecipe={() => setFormState("new")}
            onToggleFavorite={toggleFavorite}
            onAddToShopping={addFromRecipe}
          />
        )}

        {tab === "recipes" && (
          <RecipesScreen
            recipes={recipes}
            onSelectRecipe={setSelectedRecipe}
            selectedRecipe={selectedRecipe}
            onCloseDetail={() => setSelectedRecipe(null)}
            onEdit={r => setFormState(r)}
            onDelete={handleDelete}
            onToggleFavorite={toggleFavorite}
            onAddToShopping={addFromRecipe}
            onNewRecipe={() => setFormState("new")}
            initialFilter={recipesFilter}
            isEditing={isEditingRecipe}
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
            onAddFromRecipe={addFromRecipe}
          />
        )}
      </div>

      <BottomNav
        active={tab}
        onChange={t => {
          setTab(t);
          if (t !== "recipes") setSelectedRecipe(null);
          if (t === "recipes") setRecipesFilter("All");
        }}
        shoppingCount={uncheckedCount}
      />

      {formState !== null && (
        <RecipeForm
          initial={formState === "new" ? null : formState}
          onSave={handleSave}
          onCancel={() => setFormState(null)}
        />
      )}

      <ToastHost />
    </div>
  );
}