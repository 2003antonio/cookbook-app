import { useRef } from "react";

// ── ModalOverlay ──────────────────────────────────────────────────────────────
// Shared centered-dialog overlay for AuthModal, RecipeForm, and RecipeTypeChooser.
// Owns the "click only closes the dialog if the mousedown that started the click
// also started on the backdrop itself" guard — without it, a drag that starts
// inside the dialog (selecting text, dragging a tag) and releases over the
// backdrop would incorrectly close the dialog on mouseup's click event.
//
// Pass `showBackdrop={false}` for callers whose dim/blur backdrop is rendered
// elsewhere — App.js keeps one shared backdrop alive across the whole
// TypeChooser → loader → RecipeForm flow so it never flickers between steps.
// In that case the overlay stays a transparent click-catcher at the same
// position/z-index, and the real backdrop shows through from behind it.
export function ModalOverlay({ children, onClose, showBackdrop = true, zIndex = 200 }) {
  const mouseDownOnBackdrop = useRef(false);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        background: showBackdrop ? "rgba(0,0,0,0.45)" : undefined,
        backdropFilter: showBackdrop ? "blur(3px)" : undefined,
      }}
      onMouseDown={(e) => { mouseDownOnBackdrop.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (e.target === e.currentTarget && mouseDownOnBackdrop.current) onClose(); }}
    >
      {children}
    </div>
  );
}
