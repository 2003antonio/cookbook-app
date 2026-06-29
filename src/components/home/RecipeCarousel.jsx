import { useState, useRef, useEffect } from "react";
import { FavoriteCard, PlaceholderFavoriteCard, CARD_W, GAP, CARD_STEP } from "./FavoriteCard";

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

  const baseSlides = [
    ...items.map(r  => ({ type: "recipe",      id: String(r.id), recipe: r })),
    ...Array.from({ length: placeholderCount }, (_, i) => ({ type: "placeholder", id: `placeholder-${i}` })),
  ];
  const n = baseSlides.length;

  // Triple the list for infinite-loop illusion.
  const loopSlides = [...baseSlides, ...baseSlides, ...baseSlides];

  const [active,       setActive]       = useState(n);
  const [transitioning, setTransitioning] = useState(false);
  const [recentering,  setRecentering]  = useState(false);
  const [dragOffset,   setDragOffset]   = useState(0);
  const [dragPaused,   setDragPaused]   = useState(false);
  const [inView,       setInView]       = useState(true);
  const [tabVisible,   setTabVisible]   = useState(typeof document === "undefined" ? true : !document.hidden);

  const startX    = useRef(null);
  const lastX     = useRef(0);
  const velocity  = useRef(0);
  const dragging  = useRef(false);
  const dragDelta = useRef(0);

  // Re-center when slide count changes (favorite added/removed).
  useEffect(() => { setTransitioning(false); setActive(n); }, [n]);

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

  // Hold the rotation whenever the carousel isn't what the user is looking at:
  // mid-drag, scrolled off-screen, tab hidden, or covered by a sheet (`paused`
  // prop). Switching tabs unmounts this component, which clears the timer too.
  const autoplayPaused = dragPaused || paused || !inView || !tabVisible;

  // Auto-advance one card every 5s, in `direction` (1 = left, -1 = right). The
  // timer resets whenever `active` changes (manual swipe / dot tap re-centers it).
  useEffect(() => {
    if (autoplayPaused) return undefined;
    const timer = setTimeout(() => {
      setDragOffset(0);
      setTransitioning(true);
      setActive(a => a + direction);
    }, 5000);
    return () => clearTimeout(timer);
  }, [active, autoplayPaused, direction]);

  // Restore card transitions one frame after a recenter jump has been painted.
  useEffect(() => {
    if (!recentering) return undefined;
    const id = requestAnimationFrame(() => setRecentering(false));
    return () => cancelAnimationFrame(id);
  }, [recentering]);

  if (!items.length) return null;

  const goTo = idx => { setDragOffset(0); setTransitioning(true); setActive(idx); };

  // After snap, silently re-center into the middle copy of the loop. The jump
  // lands the same card on a different DOM node, so flag `recentering` to make
  // the cards' scale/shadow change instantly too — otherwise the newly-centered
  // card animates 0.96 -> 1.02 and "pops" in.
  const handleTransitionEnd = e => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    setTransitioning(false);
    if (active >= n * 2) { setRecentering(true); setActive(active - n); }
    else if (active < n) { setRecentering(true); setActive(active + n); }
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
    setDragOffset(dragDelta.current);
  };

  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
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
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          onTransitionEnd={handleTransitionEnd}
          style={{
            display: "flex", gap: GAP, paddingLeft: 24, paddingRight: 24,
            // Hug each card's own height; without this, flex stretches every card
            // to match the tallest (e.g. a 2-line name), leaving dead space below
            // shorter cards' bands.
            alignItems: "flex-start",
            transform: `translateX(calc(${-active * CARD_STEP}px + ${dragOffset}px))`,
            transition: transitioning ? "transform 0.4s cubic-bezier(0.25, 1, 0.35, 1)" : "none",
            // pan-y lets vertical page scroll through but keeps horizontal swipes
            // for the carousel; willChange promotes the track to its own layer.
            cursor: "grab", userSelect: "none", touchAction: "pan-y", willChange: "transform",
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
