import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useAuth }         from "./hooks/useAuth";
import { useRecipes }      from "./hooks/useRecipes";
import { useShoppingList } from "./hooks/useShoppingList";
import { CARD_COLORS, newPart } from "./models/recipe";
import { RecipeForm }             from "./components/recipe/RecipeForm";
import { RecipeTypeChooser }      from "./components/recipe/RecipeTypeChooser";
import { RecipeTransitionLoader } from "./components/recipe/RecipeTransitionLoader";
import { DetailSheet }            from "./components/recipe/DetailSheet";
import { ToastHost }       from "./components/ui/ToastHost";
import { BottomNav }       from "./components/nav/BottomNav";
import HomeScreen          from "./screens/HomeScreen";
import RecipesScreen       from "./screens/RecipesScreen";
import ShoppingScreen      from "./screens/ShoppingScreen";
import "./style/tokens.css";

const TAB_ORDER = ["home", "recipes", "shopping"];

// ── AnimatedScreens ───────────────────────────────────────────────────────────
// Cross-slides between bottom-nav screens: the outgoing screen keeps rendering
// while it pushes fully off in the direction of travel, and the incoming
// screen slides in from the opposite edge at the same time — both are real,
// on-screen content the whole time, so the two always tile the full width
// between them with no gap. (A single sliding screen alone would leave a gap
// once its edge moves past the container's own edge, exposing the plain app
// background underneath — that's the "bar" a lone slide-in produces.)
//
// Direction/exit-tracking is self-contained here (not lifted into App) and
// guarded by "have I already recorded a result for this exact `tab` value" so
// it stays correct under StrictMode's double-invoked render passes — the
// second pass sees its own first pass's write and reuses the cached result
// instead of re-deriving it from an already-bumped ref.
//
// This animates every tab switch, including the one triggered by opening a
// recipe from Home's "Recent" row — DetailSheet lives outside this component
// entirely now (see App's top-level <DetailSheet>), so its pull-up runs
// independently on top and is never affected by (or fighting with) this
// screen-push happening underneath it.
function AnimatedScreens({ tab, renderScreen }) {
  const [exiting, setExiting] = useState(null); // { tab, dir } while the old screen is still sliding out
  const prevRef = useRef({ tab, dir: 1 });

  if (prevRef.current.tab !== tab) {
    const dir = TAB_ORDER.indexOf(tab) >= TAB_ORDER.indexOf(prevRef.current.tab) ? 1 : -1;
    setExiting({ tab: prevRef.current.tab, dir });
    prevRef.current = { tab, dir };
  }

  const screenStyle = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 };

  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>
      {exiting && (
        <div
          key={`exit-${exiting.tab}`}
          onAnimationEnd={() => setExiting(null)}
          className={`screen-exit screen-exit--${exiting.dir >= 0 ? "next" : "prev"}`}
          style={screenStyle}
        >
          {renderScreen(exiting.tab)}
        </div>
      )}
      <div
        key={`enter-${tab}`}
        className={exiting ? `screen-enter screen-enter--${exiting.dir >= 0 ? "next" : "prev"}` : undefined}
        style={screenStyle}
      >
        {renderScreen(tab)}
      </div>
    </div>
  );
}

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

  // Back out of the form to the Simple/Multi-Part chooser without closing the
  // whole create flow — the shared backdrop stays up the entire time.
  const handleBackToChooser = () => {
    setFormState(null);
    setTransitionPhase("idle");
    setShowTypeChooser(true);
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
  // (used by Home's "Recent" row). DetailSheet is always mounted (see the
  // top-level <DetailSheet> below), so setting selectedRecipe here is a
  // normal open transition regardless of which tab we're navigating from.
  const handleOpenRecipe = (recipe) => {
    setRecipesFilter("All");
    setSelectedRecipe(recipe);
    setTab("recipes");
  };

  const uncheckedCount = shoppingItems.filter(i => !i.checked).length;

  // Returns the screen for an arbitrary tab id — needed by AnimatedScreens,
  // which can render both the entering *and* exiting tab's screen at once.
  const renderScreen = (t) => {
    if (t === "home") return (
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
    );
    if (t === "recipes") return (
      <RecipesScreen
        recipes={recipes}
        onSelectRecipe={setSelectedRecipe}
        selectedRecipe={selectedRecipe}
        onToggleFavorite={toggleFavorite}
        onNewRecipe={openNewRecipeFlow}
        initialFilter={recipesFilter}
      />
    );
    if (t === "shopping") return (
      <ShoppingScreen
        items={shoppingItems}
        onAdd={addItem}
        onToggle={toggleItem}
        onRemove={removeItem}
        onClearChecked={clearChecked}
        recipes={recipes}
        onAddFromRecipe={addFromRecipe}
      />
    );
    return null;
  };

  return (
    <div style={{
      height: "100dvh", display: "flex", flexDirection: "column",
      background: "var(--paper)", overflow: "hidden", position: "relative",
    }}>
      <AnimatedScreens tab={tab} renderScreen={renderScreen} />

      {/* Lives outside the animated screen tree on purpose — see AnimatedScreens'
          comment. Always mounted so opening it is a real slide-up transition,
          not an instant appearance (same reasoning as RecipePreviewSheet). */}
      <DetailSheet
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onEdit={r => { showBackdrop(); setFormState(r); }}
        onDelete={handleDelete}
        onToggleFavorite={toggleFavorite}
        onAddToShopping={addFromRecipe}
      />

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
          onBackToChooser={!formState?.id ? handleBackToChooser : undefined}
          recipes={recipes}
          isEntering={transitionPhase === "form-enter"}
        />
      )}

      <ToastHost />
    </div>
  );
}