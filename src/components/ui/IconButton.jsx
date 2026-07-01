import { useState } from "react";

// ── IconButton ────────────────────────────────────────────────────────────────
// Shared circular icon-button primitive. Consolidates the ~34px/~30px/~28px
// round buttons (favorite, edit, close, back/next…) that used to be hand-written
// inline in RecipeDetail, RecipeForm, RecipeTypeChooser, AuthModal, and
// RecipePreviewSheet. Pass `hoverBackground` to get the same "lighten on hover"
// treatment those buttons had; omit it for buttons that never had a hover state.
export function IconButton({
  children,
  onClick,
  title,
  ariaLabel,
  size = 34,
  background = "var(--surface)",
  hoverBackground,
  color = "inherit",
  fontSize = 14,
  backdropBlur = false,
  disabled = false,
  style,
  ...rest
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || title}
      disabled={disabled}
      onMouseEnter={() => hoverBackground && setHovered(true)}
      onMouseLeave={() => hoverBackground && setHovered(false)}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: hovered && hoverBackground ? hoverBackground : background,
        backdropFilter: backdropBlur ? "blur(4px)" : undefined,
        color,
        fontSize,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "background 0.15s",
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? "default" : "pointer",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
