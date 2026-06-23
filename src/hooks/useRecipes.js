import { useState, useEffect, useCallback } from "react";
import { supabase }                         from "../services/supabaseClient";
import { SEED_RECIPES }                     from "../data/seeds";
import { formatIngredient }                 from "../models/recipe";
import { recipeToRow, rowToRecipe, rowToItem } from "../services/recipeService";

// ── useRecipes ────────────────────────────────────────────────────────────────
// Manages the recipe list. Signed-out users see the read-only seed set;
// signed-in users read/write from Supabase with optimistic local updates.
export function useRecipes(userId) {
  const [recipes, setRecipes] = useState(SEED_RECIPES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setRecipes(SEED_RECIPES);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("recipes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);
        if (error) {
          console.error("Failed to load recipes:", error.message);
          setRecipes([]);
          return;
        }
        setRecipes((data || []).map(rowToRecipe));
      });

    return () => { cancelled = true; };
  }, [userId]);

  const addRecipe = useCallback((recipe) => {
    const id = crypto.randomUUID();
    const r  = { ...recipe, id, createdAt: Date.now(), favorite: false };
    setRecipes(prev => [r, ...prev]);

    if (userId) {
      supabase
        .from("recipes")
        .insert({ id, user_id: userId, ...recipeToRow(r) })
        .then(({ error }) => {
          if (error) {
            console.error("Failed to save recipe:", error.message);
            setRecipes(prev => prev.filter(x => x.id !== id));
          }
        });
    }

    return r;
  }, [userId]);

  const updateRecipe = useCallback((id, updates) => {
    setRecipes(prev =>
      prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r)
    );

    if (!userId) return;

    supabase
      .from("recipes")
      .update({ ...recipeToRow(updates), updated_at: new Date().toISOString() })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Failed to update recipe:", error.message);
      });
  }, [userId]);

  const deleteRecipe = useCallback((id) => {
    let removed;
    setRecipes(prev => {
      removed = prev.find(r => r.id === id);
      return prev.filter(r => r.id !== id);
    });

    if (!userId) return;

    supabase.from("recipes").delete().eq("id", id).then(({ error }) => {
      if (error) {
        console.error("Failed to delete recipe:", error.message);
        if (removed) setRecipes(prev => [removed, ...prev]);
      }
    });
  }, [userId]);

  const toggleFavorite = useCallback((id) => {
    let nextFavorite;
    setRecipes(prev => prev.map(r => {
      if (r.id !== id) return r;
      nextFavorite = !r.favorite;
      return { ...r, favorite: nextFavorite };
    }));

    if (!userId) return;

    supabase.from("recipes").update({ favorite: nextFavorite }).eq("id", id).then(({ error }) => {
      if (error) {
        console.error("Failed to update favorite:", error.message);
        setRecipes(prev => prev.map(r => r.id === id ? { ...r, favorite: !nextFavorite } : r));
      }
    });
  }, [userId]);

  return { recipes, addRecipe, updateRecipe, deleteRecipe, toggleFavorite, loading };
}

// ── useShoppingList ───────────────────────────────────────────────────────────
// Manages the shopping list. Signed-out users get an empty list (nothing
// persisted); signed-in users sync to Supabase with optimistic updates.
export function useShoppingList(userId) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setItems([]);
      return;
    }

    supabase
      .from("shopping_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load shopping list:", error.message);
          setItems([]);
          return;
        }
        setItems((data || []).map(rowToItem));
      });

    return () => { cancelled = true; };
  }, [userId]);

  const addItem = useCallback((text) => {
    if (!text.trim()) return;
    const id   = crypto.randomUUID();
    const item = { id, text: text.trim(), checked: false };
    setItems(prev => [...prev, item]);

    if (!userId) return;

    supabase.from("shopping_items")
      .insert({ id, user_id: userId, text: item.text, checked: false })
      .then(({ error }) => {
        if (error) {
          console.error("Failed to add shopping item:", error.message);
          setItems(prev => prev.filter(i => i.id !== id));
        }
      });
  }, [userId]);

  const toggleItem = useCallback((id) => {
    let nextChecked;
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      nextChecked = !i.checked;
      return { ...i, checked: nextChecked };
    }));

    if (!userId) return;

    supabase.from("shopping_items").update({ checked: nextChecked }).eq("id", id)
      .then(({ error }) => {
        if (error) {
          console.error("Failed to update shopping item:", error.message);
          setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !nextChecked } : i));
        }
      });
  }, [userId]);

  const removeItem = useCallback((id) => {
    let removed;
    setItems(prev => {
      removed = prev.find(i => i.id === id);
      return prev.filter(i => i.id !== id);
    });

    if (!userId) return;

    supabase.from("shopping_items").delete().eq("id", id)
      .then(({ error }) => {
        if (error) {
          console.error("Failed to remove shopping item:", error.message);
          if (removed) setItems(prev => [...prev, removed]);
        }
      });
  }, [userId]);

  const clearChecked = useCallback(() => {
    let removedIds = [];
    setItems(prev => {
      removedIds = prev.filter(i => i.checked).map(i => i.id);
      return prev.filter(i => !i.checked);
    });

    if (!userId || removedIds.length === 0) return;

    supabase.from("shopping_items").delete().in("id", removedIds)
      .then(({ error }) => {
        if (error) console.error("Failed to clear checked items:", error.message);
      });
  }, [userId]);

  const addFromRecipe = useCallback((recipe) => {
    const newItems = recipe.ingredients
      .filter(ing => ing.name.trim())
      .map(ing => ({
        id:         crypto.randomUUID(),
        text:       formatIngredient(ing),
        checked:    false,
        fromRecipe: recipe.name,
      }));
    if (!newItems.length) return;

    setItems(prev => [...prev, ...newItems]);

    if (!userId) return;

    supabase.from("shopping_items")
      .insert(newItems.map(i => ({
        id:          i.id,
        user_id:     userId,
        text:        i.text,
        checked:     false,
        from_recipe: i.fromRecipe,
      })))
      .then(({ error }) => {
        if (error) {
          console.error("Failed to add ingredients to shopping list:", error.message);
          const ids = new Set(newItems.map(i => i.id));
          setItems(prev => prev.filter(i => !ids.has(i.id)));
        }
      });
  }, [userId]);

  return { items, addItem, toggleItem, removeItem, clearChecked, addFromRecipe };
}
