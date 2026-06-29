import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useAuth }         from "./hooks/useAuth";
import { useRecipes }      from "./hooks/useRecipes";
import { useShoppingList } from "./hooks/useShoppingList";
import { CARD_COLORS, newPart } from "./models/recipe";
import { RecipeForm }             from "./components/recipe/RecipeForm";
import { RecipeTypeChooser }      from "./components/recipe/RecipeTypeChooser";
import { RecipeTransitionLoader } from "./components/recipe/RecipeTransitionLoader";
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

  // ── Theme ─────────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('cookbook-theme') || 'dark');
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cookbook-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const { recipes, addRecipe, updateRecipe, deleteRecipe, toggleFavorite } = useRecipes(userId);
  const { items: shoppingItems, addItem, toggleItem, removeItem, clearChecked, addFromRecipe } = useShoppingList(userId);

  const [tab,             setTab]             = useState("home");
  const [selectedRecipe,  setSelectedRecipe]  = useState(null);
  const [formState,       setFormState]       = useState(null);
  const [recipesFilter,   setRecipesFilter]   = useState("All");
  const [showTypeChooser, setShowTypeChooser] = useState(false);
  // 'idle' | 'chooser-exit' | 'loading-enter' | 'loading-exit' | 'form-enter'
  const [transitionPhase, setTransitionPhase] = useState("idle");
  const pendingFormStateRef = useRef(null);
  const transitionTimerRef  = useRef(null);

  // ── Shared backdrop ───────────────────────────────────────────────────────────
  // A single backdrop is kept alive for the entire modal flow so it never
  // flickers when switching between TypeChooser → loader → RecipeForm.
  const [backdropVisible,  setBackdropVisible]  = useState(false);
  const [backdropExiting,  setBackdropExiting]  = useState(false);
  const backdropVisibleRef = useRef(false);
  const backdropTimerRef   = useRef(null);

  // Show/hide the shared backdrop.
  const showBackdrop = useCallback(() => {
    clearTimeout(backdropTimerRef.current);
    backdropVisibleRef.current = true;
    setBackdropExiting(false);
    setBackdropVisible(true);
  }, []);

  const hideBackdrop = useCallback(() => {
    if (!backdropVisibleRef.current) return;
    setBackdropExiting(true);
    backdropTimerRef.current = setTimeout(() => {
      backdropVisibleRef.current = false;
      setBackdropVisible(false);
      setBackdropExiting(false);
    }, 210);
  }, []);

  // Opens the "Simple vs. Multi-part" chooser; replaces the old direct-to-form flow.
  const openNewRecipeFlow = () => { showBackdrop(); setTransitionPhase("idle"); setShowTypeChooser(true); };

  const blankRecipeBase = () => ({
    name: "", category: "Main Dish", prepTime: "", cookTime: "",
    baseServings: 4, color: CARD_COLORS[0], image: "", rating: 0, tags: [], notes: "",
  });

  // Kick off the animated transition sequence.
  // Timeline: chooser panel exits (180ms) → loader fades in (150ms) →
  //   loader fully visible (~250ms) → loader fades out (200ms) → form enters (240ms)
  const startTransition = (nextFormState) => {
    pendingFormStateRef.current = nextFormState;
    setTransitionPhase("chooser-exit");           // TypeChooser panel plays exit anim

    const t1 = setTimeout(() => {
      setShowTypeChooser(false);
      setTransitionPhase("loading-enter");        // loader icon fades in
    }, 180);

    const t2 = setTimeout(() => {
      setTransitionPhase("loading-exit");         // loader icon fades out (200ms)
    }, 530);

    const t3 = setTimeout(() => {
      setFormState(pendingFormStateRef.current);  // RecipeForm mounts
      setTransitionPhase("form-enter");
    }, 730);

    const t4 = setTimeout(() => {
      setTransitionPhase("idle");
    }, 970);

    transitionTimerRef.current = [t1, t2, t3, t4];
  };

  // Clean up timers if component unmounts mid-transition.
  useEffect(() => () => {
    transitionTimerRef.current?.forEach(clearTimeout);
    clearTimeout(backdropTimerRef.current);
  }, []);

  const handleChooseSimple    = () => startTransition("new");
  const handleChooseMultiPart = () => startTransition({ ...blankRecipeBase(), parts: [newPart(), newPart()] });

  const handleSave = (data) => {
    if (!formState?.id) {
      // "new" string or a multi-part starter object (no id) → create
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
    hideBackdrop();
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
            onNewRecipe={openNewRecipeFlow}
            onToggleFavorite={toggleFavorite}
            onAddToShopping={addFromRecipe}
            session={session}
            authLoading={authLoading}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        )}

        {tab === "recipes" && (
          <RecipesScreen
            recipes={recipes}
            onSelectRecipe={setSelectedRecipe}
            selectedRecipe={selectedRecipe}
            onCloseDetail={() => setSelectedRecipe(null)}
            onEdit={r => { showBackdrop(); setFormState(r); }}
            onDelete={handleDelete}
            onToggleFavorite={toggleFavorite}
            onAddToShopping={addFromRecipe}
            onNewRecipe={openNewRecipeFlow}
            onNavigateRecipe={id => setSelectedRecipe(recipes.find(r => r.id === id) ?? null)}
            initialFilter={recipesFilter}
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

      {/* Shared backdrop — persists across the entire TypeChooser → loader → RecipeForm flow */}
      {backdropVisible && (
        <div
          className={backdropExiting ? "backdrop-exiting" : "backdrop-entering"}
          style={{
            position: "fixed", inset: 0, zIndex: 199,
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)",
            pointerEvents: "none",
          }}
        />
      )}

      {showTypeChooser && (
        <RecipeTypeChooser
          onChooseSimple={handleChooseSimple}
          onChooseMultiPart={handleChooseMultiPart}
          onCancel={() => { setShowTypeChooser(false); setTransitionPhase("idle"); hideBackdrop(); }}
          isExiting={transitionPhase === "chooser-exit"}
        />
      )}

      {(transitionPhase === "loading-enter" || transitionPhase === "loading-exit") && (
        <RecipeTransitionLoader
          phase={transitionPhase === "loading-enter" ? "entering" : "exiting"}
        />
      )}

      {formState !== null && (
        <RecipeForm
          initial={formState === "new" ? null : formState}
          onSave={handleSave}
          onCancel={() => { setFormState(null); setTransitionPhase("idle"); hideBackdrop(); }}
          onDelete={handleDelete}
          recipes={recipes}
          isEntering={transitionPhase === "form-enter"}
        />
      )}

      <ToastHost />
    </div>
  );
}