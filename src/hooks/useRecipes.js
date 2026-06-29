import { useState, useEffect, useCallback } from "react";
import { supabase }                         from "../services/supabaseClient";
import { SEED_RECIPES }                     from "../data/seeds";
import { recipeToRow, rowToRecipe }         from "../services/recipeService";
import { uploadRecipeImage, deleteRecipeImage, isDataUrl } from "../services/storageService";
import { normalizeRecipe }                  from "../models/recipe";

// Seeds are authored in the legacy `components` shape — migrate to `parts` once
// up front so every recipe in state has a consistent shape.
const SEED_PARTS = SEED_RECIPES.map(normalizeRecipe);

// ── useRecipes ────────────────────────────────────────────────────────────────
// Manages the recipe list. Signed-out users see the read-only seed set;
// signed-in users read/write from Supabase with optimistic local updates.
export function useRecipes(userId) {
  const [recipes, setRecipes] = useState(SEED_PARTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setRecipes(SEED_PARTS);
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
      (async () => {
        // Upload the cover photo to Storage first; the row stores only its URL.
        const row = { ...r };
        if (isDataUrl(r.image)) {
          row.image = await uploadRecipeImage(userId, id, r.image) || "";
          // Swap the heavy inline data URL in local state for the hosted URL.
          setRecipes(prev => prev.map(x => x.id === id ? { ...x, image: row.image } : x));
        }
        const { error } = await supabase
          .from("recipes")
          .insert({ id, user_id: userId, ...recipeToRow(row) });
        if (error) {
          console.error("Failed to save recipe:", error.message);
          setRecipes(prev => prev.filter(x => x.id !== id));
        }
      })();
    }

    return r;
  }, [userId]);

  const updateRecipe = useCallback((id, updates) => {
    setRecipes(prev =>
      prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r)
    );

    if (!userId) return;

    (async () => {
      const next = { ...updates };
      // A new photo (data URL) is uploaded; clearing it removes the stored file.
      if (Object.prototype.hasOwnProperty.call(updates, "image")) {
        if (isDataUrl(updates.image)) {
          next.image = await uploadRecipeImage(userId, id, updates.image) || "";
          setRecipes(prev => prev.map(r => r.id === id ? { ...r, image: next.image } : r));
        } else if (!updates.image) {
          deleteRecipeImage(userId, id);
        }
      }
      const { error } = await supabase
        .from("recipes")
        .update({ ...recipeToRow(next), updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) console.error("Failed to update recipe:", error.message);
    })();
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
      } else {
        deleteRecipeImage(userId, id);  // best-effort cleanup of the stored photo
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
