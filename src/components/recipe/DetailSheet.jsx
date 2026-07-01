import { RecipeDetail } from "./RecipeDetail";
import { BottomSheet } from "../ui/BottomSheet";

export function DetailSheet({ recipe, onClose, onEdit, onDelete, onToggleFavorite, onAddToShopping }) {
  return (
    <BottomSheet open={!!recipe} onClose={onClose} height="92vh" closeDurationMs={360}>
      {(closeSheet) => recipe && (
        <div style={{ position: "absolute", inset: 0, overflowY: "auto" }}>
          <RecipeDetail
            key={recipe.id}
            recipe={recipe}
            onClose={closeSheet}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            onAddToShopping={onAddToShopping}
          />
        </div>
      )}
    </BottomSheet>
  );
}
