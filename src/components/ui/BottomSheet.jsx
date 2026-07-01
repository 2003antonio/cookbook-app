import { useState, useRef, useEffect } from "react";

// ── BottomSheet ───────────────────────────────────────────────────────────────
// Shared chrome for the app's bottom sheets (recipe detail, recipe preview,
// favorite picker): backdrop, rounded sheet container, drag-to-dismiss handle,
// body-scroll lock while open, and a "play the exit animation, then call
// onClose" delay so the sheet visibly slides away before the parent unmounts it.
//
// `open` controls visibility. `children` may be a plain node, or a function
// `(closeSheet) => node` — pass a function when something inside (a header ✕
// button, a stacked recipe's back arrow) needs to trigger the same animated
// close that the backdrop tap and drag-to-dismiss already use, instead of
// calling the raw `onClose` prop and skipping the exit animation.
//
// `height` renders the sheet at a fixed height (the recipe sheets, which want a
// consistent tall panel); pass `maxHeight` instead for a sheet that should only
// grow to fit its content, capped at that height (the favorite picker).
export function BottomSheet({
  open,
  onClose,
  children,
  height,
  maxHeight,
  closeDurationMs = 340,
  dismissThreshold = 200,
  zIndex = 90,
}) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const startY = useRef(0);

  // Lock background scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const original = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [open]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, closeDurationMs);
  };

  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };
  const handleTouchMove = (e) => {
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setDragY(delta);
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > dismissThreshold) handleClose();
    setDragY(0);
  };

  // During drag: follow the finger. Closing: slide fully off. Otherwise: open
  // at 0, or parked off-screen at 100% (still mounted so it can animate back in
  // — this matches DetailSheet, which stays mounted across open/close cycles).
  const getTransform = () => {
    if (isDragging) return `translateY(${dragY}px)`;
    if (closing)    return "translateY(100%)";
    if (open)       return "translateY(0)";
    return "translateY(100%)";
  };

  return (
    <>
      {open && (
        <div
          onClick={handleClose}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)",
            zIndex,
            opacity: closing ? 0 : 1,
            transition: `opacity ${closeDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            animation: closing ? undefined : "sheetBackdropIn 0.2s ease",
          }}
        />
      )}

      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0,
        ...(height    ? { height }    : {}),
        ...(maxHeight ? { maxHeight } : {}),
        background: "var(--card-bg)",
        borderRadius: "24px 24px 0 0",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
        zIndex: zIndex + 1, overflow: "hidden",
        display: "flex", flexDirection: "column",
        transform: getTransform(),
        transition: isDragging ? "none" : `transform ${closeDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}>
        {/* Drag handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            flexShrink: 0, background: "var(--card-bg)",
            padding: "10px 0 5px", display: "flex", justifyContent: "center",
            cursor: "grab", touchAction: "none",
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--border)" }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
          {typeof children === "function" ? children(handleClose) : children}
        </div>
      </div>

      <style>{`
        @keyframes sheetBackdropIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </>
  );
}
