import { useState, useRef, useEffect, useMemo } from "react";
import { FavoriteCard, PlaceholderFavoriteCard, CARD_W, GAP, CARD_STEP } from "./FavoriteCard";

// Remembers each carousel's current logical position across unmounts, keyed by
// `title`. Switching bottom-nav tabs unmounts HomeScreen, so without this the
// carousel would snap back to the first card on return; instead it resumes where
// the user left it. Lives for the app session (cleared on a full page reload).
const savedDotByTitle = new Map();

// Auto-rotating, infinitely-looping card carousel. Used for both the Favorites
// row (direction 1, scrolls left) and the Recent row (direction -1, scrolls
// right). Pass `onAddNew` to pad short lists with "add a favorite" placeholders;
// rows without it (Recent) just loop their own cards.
export function RecipeCarousel({ title, items, onSelect, onAddNew, direction = 1, paused = false }) {
  const outerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const measure = () => setContainerWidth(outerRef.current?.offsetWidth || window.innerWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Build the base slide list. Favorites pad with placeholders so the loop is
  // always full enough; other rows just use their own cards.
  const wantPlaceholders = typeof onAddNew === "function";
  const visibleCount     = containerWidth ? Math.max(1, Math.ceil(containerWidth / CARD_STEP)) : 2;
  const minSlides        = Math.max(visibleCount * 2, 3);
  const placeholderCount = wantPlaceholders ? Math.max(0, minSlides - items.length) : 0;

  // Memoized so the per-pointer-move drag re-renders don't reallocate the whole
  // 3n-object slide list every frame.
  const baseSlides = useMemo(() => [
    ...items.map(r  => ({ type: "recipe",      id: String(r.id), recipe: r })),
    ...Array.from({ length: placeholderCount }, (_, i) => ({ type: "placeholder", id: `placeholder-${i}` })),
  ], [items, placeholderCount]);
  const n = baseSlides.length;

  // Triple the list for infinite-loop illusion.
  const loopSlides = useMemo(() => [...baseSlides, ...baseSlides, ...baseSlides], [baseSlides]);

  // Start where this carousel was last left (restored from the cross-unmount
  // store); falls back to the first card on the very first mount.
  const [active,       setActive]       = useState(() => n + ((savedDotByTitle.get(title) ?? 0) % n));
  const [transitioning, setTransitioning] = useState(false);
  const [recentering,  setRecentering]  = useState(false);
  const [dragPaused,   setDragPaused]   = useState(false);
  const [hovered,      setHovered]      = useState(false);
  const [inView,       setInView]       = useState(true);
  const [tabVisible,   setTabVisible]   = useState(typeof document === "undefined" ? true : !document.hidden);
  const [reduceMotion, setReduceMotion] = useState(
    typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );

  const startX    = useRef(null);
  const lastX     = useRef(0);
  const velocity  = useRef(0);
  const dragging  = useRef(false);
  const dragDelta = useRef(0);
  const trackRef  = useRef(null);
  const rafId     = useRef(null);

  // Re-center into the middle loop copy when the slide count changes (favorite
  // added/removed, or width measure changes the placeholder padding), keeping
  // the user on the same logical card rather than snapping back to the first.
  useEffect(() => {
    setTransitioning(false);
    setActive(n + ((savedDotByTitle.get(title) ?? 0) % n));
  }, [n, title]);

  // Persist the centered card so it survives this component unmounting (tab
  // switch). The recenter jump moves `active` by ±n but leaves the logical
  // position unchanged, so this writes the same value — harmless.
  useEffect(() => { savedDotByTitle.set(title, ((active % n) + n) % n); }, [title, active, n]);

  // Pause rotation when the carousel scrolls out of view.
  useEffect(() => {
    const el = outerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Pause rotation when the browser tab is backgrounded.
  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Honour the OS "reduce motion" setting — never auto-rotate for those users
  // (manual swipe still works). Mirrors RecipeStats, which also opts out.
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return undefined;
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Hold the rotation whenever the carousel isn't what the user is actively
  // looking at or interacting with: mid-drag, hovered (reading a card), scrolled
  // off-screen, tab hidden, covered by a sheet (`paused`), or reduced-motion.
  // Switching tabs unmounts this component, which clears the timer too.
  const autoplayPaused = dragPaused || hovered || paused || !inView || !tabVisible || reduceMotion;

  // Auto-advance one card every 5s, in `direction` (1 = left, -1 = right). The
  // timer resets whenever `active` changes (manual swipe / dot tap re-centers it).
  useEffect(() => {
    if (autoplayPaused) return undefined;
    const timer = setTimeout(() => {
      setTransitioning(true);
      setActive(a => a + direction);
    }, 4750);
    return () => clearTimeout(timer);
  }, [active, autoplayPaused, direction]);

  // Cancel any in-flight drag-transform frame on unmount (tab switch mid-drag).
  useEffect(() => () => { if (rafId.current != null) cancelAnimationFrame(rafId.current); }, []);

  // Restore card transitions one frame after a recenter jump has been painted.
  useEffect(() => {
    if (!recentering) return undefined;
    const id = requestAnimationFrame(() => setRecentering(false));
    return () => cancelAnimationFrame(id);
  }, [recentering]);

  if (!items.length) return null;

  const goTo = idx => { setTransitioning(true); setActive(idx); };

  // After snap, silently re-center into the middle copy of the loop. The jump
  // lands the same card on a different DOM node, so flag `recentering` to make
  // the cards' scale/shadow change instantly too — otherwise the newly-centered
  // card animates 0.96 -> 1.02 and "pops" in.
  const handleTransitionEnd = e => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    setTransitioning(false);
    // Wrap `active` back into the middle copy [n, 2n). A modulo (not a single
    // ±n) is required because a multi-card drag can overshoot the middle copy by
    // more than n — a single correction would leave `active` outside the range
    // and strand the loop in an end copy with blank space beside it.
    if (active < n || active >= n * 2) {
      setRecentering(true);
      setActive(n + (((active - n) % n) + n) % n);
    }
  };

  // Writes the dragged transform straight to the DOM, skipping React state/
  // render entirely while the finger is moving. touchmove fires far more often
  // than mouseMove and at less predictable cadence, so funnelling every tick
  // through setState (full re-render) is what made touch dragging choppy while
  // mouse dragging looked fine. rAF-throttled to at most one paint per frame.
  const applyTransform = () => {
    rafId.current = null;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(calc(${-active * CARD_STEP}px + ${dragDelta.current}px))`;
    }
  };

  const onDown = e => {
    startX.current  = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    lastX.current   = startX.current;
    dragging.current  = true;
    dragDelta.current = 0;
    velocity.current  = 0;
    setDragPaused(true);
    setTransitioning(false);
  };

  const onMove = e => {
    if (!dragging.current) return;
    const x = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    velocity.current  = x - lastX.current;
    lastX.current     = x;
    dragDelta.current = x - startX.current;
    if (rafId.current == null) rafId.current = requestAnimationFrame(applyTransform);
  };

  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (rafId.current != null) { cancelAnimationFrame(rafId.current); rafId.current = null; }
    setDragPaused(false);
    const move = dragDelta.current;
    const v    = velocity.current;
    const threshold = CARD_W * 0.25;
    // Land on whichever card the drag actually travelled to, so a long drag
    // settles there instead of rubber-banding all the way back to the neighbour.
    let steps = Math.round(-move / CARD_STEP);
    // A short flick that rounds to zero still advances one card in its direction.
    if (steps === 0) {
      if (move < -threshold || v < -5) steps = 1;
      else if (move > threshold || v > 5) steps = -1;
    }
    // Never travel past the rendered triple-loop: from the middle copy a move of
    // ±n still lands on a real card (indices 0..3n-1), but a wilder mouse drag
    // would slide onto empty track before the recenter can wrap it.
    steps = Math.max(-n, Math.min(n, steps));
    goTo(active + steps);
  };

  const activeDot = ((active % n) + n) % n;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>
          {title}
        </h2>
        <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>{activeDot + 1} / {n}</span>
      </div>

      <div ref={outerRef} style={{ overflow: "hidden", margin: "0 -24px", padding: "4px 0 16px" }}>
        <div
          ref={trackRef}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
          // Only a true mouse pointer pauses on hover; touch taps synthesize a
          // mouseenter that would otherwise leave autoplay stuck paused.
          onMouseEnter={() => { if (window.matchMedia?.("(hover: hover)").matches) setHovered(true); }}
          onMouseLeave={() => { setHovered(false); onUp(); }}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          onTransitionEnd={handleTransitionEnd}
          style={{
            display: "flex", gap: GAP, paddingLeft: 24, paddingRight: 24,
            // Hug each card's own height; without this, flex stretches every card
            // to match the tallest (e.g. a 2-line name), leaving dead space below
            // shorter cards' bands.
            alignItems: "flex-start",
            transform: `translateX(${-active * CARD_STEP}px)`,
            transition: transitioning ? "transform 0.4s cubic-bezier(0.25, 1, 0.35, 1)" : "none",
            // pan-y lets vertical page scroll through but keeps horizontal swipes
            // for the carousel; willChange promotes the track to its own layer only
            // while it's actually moving, so idle carousels don't pin a GPU layer.
            cursor: "grab", userSelect: "none", touchAction: "pan-y",
            willChange: transitioning || dragPaused ? "transform" : "auto",
          }}
        >
          {loopSlides.map((slide, i) => {
            const isActive = i === active;
            const copyIdx  = Math.floor(i / n);
            return slide.type === "recipe" ? (
              <FavoriteCard
                key={`${copyIdx}-${slide.id}`}
                recipe={slide.recipe}
                active={isActive}
                onSelect={onSelect}
                dragDelta={dragDelta}
                instant={recentering}
              />
            ) : (
              <PlaceholderFavoriteCard
                key={`${copyIdx}-${slide.id}`}
                active={isActive}
                onAddNew={onAddNew}
                dragDelta={dragDelta}
                instant={recentering}
              />
            );
          })}
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        {baseSlides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to ${title} item ${i + 1} of ${n}`}
            onClick={() => goTo(active + (i - activeDot))}
            style={{
              width: i === activeDot ? 20 : 6, height: 6,
              borderRadius: 999,
              background: i === activeDot ? "var(--fire)" : "var(--border)",
              transition: "all 0.25s ease", padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
