import { useState, useEffect, useCallback } from "react";
import { supabase }                         from "../services/supabaseClient";
import { formatIngredient, allIngredients } from "../models/recipe";
import { rowToItem }                        from "../services/shoppingService";
import { stripNullBytes }                   from "../utils/sanitize";
import { showToast }                        from "../components/ui/ToastHost";

const SAVE_FAILED_MSG = "Couldn't save — check your connection and try again";

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
      .insert(stripNullBytes({ id, user_id: userId, text: item.text, checked: false }))
      .then(({ error }) => {
        if (error) {
          console.error("Failed to add shopping item:", error.message);
          setItems(prev => prev.filter(i => i.id !== id));
          showToast(SAVE_FAILED_MSG);
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
          showToast(SAVE_FAILED_MSG);
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
          showToast(SAVE_FAILED_MSG);
        }
      });
  }, [userId]);

  const clearChecked = useCallback(() => {
    let removed = [];
    setItems(prev => {
      removed = prev.filter(i => i.checked);
      return prev.filter(i => !i.checked);
    });

    if (!userId || removed.length === 0) return;

    supabase.from("shopping_items").delete().in("id", removed.map(i => i.id))
      .then(({ error }) => {
        if (error) {
          console.error("Failed to clear checked items:", error.message);
          setItems(prev => [...prev, ...removed]);
          showToast(SAVE_FAILED_MSG);
        }
      });
  }, [userId]);

  const addFromRecipe = useCallback((recipe) => {
    const newItems = allIngredients(recipe)
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
      .insert(newItems.map(i => stripNullBytes({
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
          showToast(SAVE_FAILED_MSG);
        }
      });
  }, [userId]);

  return { items, addItem, toggleItem, removeItem, clearChecked, addFromRecipe };
}
