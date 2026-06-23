import { useState }        from "react";
import { useAuth }         from "./hooks/useAuth";
import { useRecipes }      from "./hooks/useRecipes";
import { useShoppingList } from "./hooks/useShoppingList";
import { CARD_COLORS }     from "./models/recipe";
import { RecipeForm }      from "./components/recipe/RecipeForm";
import { ToastHost }       from "./components/ui/ToastHost";
import { BottomNav }       from "./components/nav/BottomNav";
import HomeScreen          from "./screens/HomeScreen";
import RecipesScreen       from "./screens/RecipesScreen";
import ShoppingScreen      from "./screens/ShoppingScreen";
import "./style/tokens.css";

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user?.id ?? null;

  const { recipes, addRecipe, updateRecipe, deleteRecipe, toggleFavorite } = useRecipes(userId);
  const { items: shoppingItems, addItem, toggleItem, removeItem, clearChecked, addFromRecipe } = useShoppingList(userId);

  const [tab,            setTab]            = useState("home");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [formState,      setFormState]      = useState(null);
  const [recipesFilter,  setRecipesFilter]  = useState("All");

  const handleSave = (data) => {
    if (!formState?.id) {
      // "new" string or a component-prefill object (no id) → create
      const created = addRecipe(data);
      // If saving from "Save as standalone recipe", auto-link parent recipe's
      // unlinked recipe-link ingredients that share the component's name
      if (formState?._parentRecipeId && formState?._compName) {
        const parentRecipe = recipes.find(r => r.id === formState._parentRecipeId);
        if (parentRecipe) {
          const updatedComponents = parentRecipe.components.map(c => ({
            ...c,
            // Mark the source component as already saved standalone
            ...(c.name === formState._compName ? { linkedRecipeId: created.id } : {}),
            // Auto-link any recipe-link ingredients that share the component name
            ingredients: (c.ingredients || []).map(ing =>
              ing.type === "recipe" && ing.recipeName === formState._compName && !ing.recipeId
                ? { ...ing, recipeId: created.id }
                : ing
            ),
          }));
          updateRecipe(formState._parentRecipeId, { components: updatedComponents });
        }
      }
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

  // Open the form pre-filled with a component's data as a new recipe
  const handleCreateFromComponent = (comp, parentRecipeId) => {
    setFormState({
      name:         comp.name || "",
      category:     "Main Dish",
      prepTime:     "",
      cookTime:     "",
      baseServings: 4,
      color:        CARD_COLORS[0],
      rating:       0,
      tags:         [],
      notes:        "",
      components:   [{ ...comp, name: "" }],
      _prefill:         true,
      _parentRecipeId:  parentRecipeId,
      _compName:        comp.name || "",
    });
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
            session={session}
            authLoading={authLoading}
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
            onNavigateRecipe={id => setSelectedRecipe(recipes.find(r => r.id === id) ?? null)}
            onCreateFromComponent={handleCreateFromComponent}
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
          initial={formState === "new" ? null : (formState?.id ? formState : { ...formState, _prefill: true })}
          onSave={handleSave}
          onCancel={() => setFormState(null)}
          recipes={recipes}
        />
      )}

      <ToastHost />
    </div>
  );
}