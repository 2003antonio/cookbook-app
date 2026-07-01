import { useRef } from "react";

// ── useSlideDirection ─────────────────────────────────────────────────────────
// Shared by every directional tab/panel switch in the app (RecipeForm's tabs,
// RecipeDetail/RecipePreviewSheet's ingredient/steps/notes tabs, the bottom-nav
// screens). Tracks whether `activeKey` moved to a later or earlier position in
// `order` compared to last time, returning +1/-1 and whether this is a genuine
// switch (false on first mount, so callers don't animate in on initial render).
//
// Guarded by "have I already recorded a result for this exact activeKey" so it
// stays correct under StrictMode's double-invoked render passes in
// development — the duplicate pass sees its own first pass's write and reuses
// the cached direction instead of re-deriving it from an already-bumped ref,
// which is what silently flips the direction wrong every other switch.
export function useSlideDirection(activeKey, order) {
  const idx = order.indexOf(activeKey);
  const ref = useRef({ key: activeKey, idx, dir: 1, hasSwitched: false });

  if (ref.current.key !== activeKey) {
    const dir = idx >= ref.current.idx ? 1 : -1;
    ref.current = { key: activeKey, idx, dir, hasSwitched: true };
  }

  return { direction: ref.current.dir, hasSwitched: ref.current.hasSwitched };
}
