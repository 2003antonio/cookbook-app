import { useState, useRef, useEffect } from "react";
import { FavoriteCard, PlaceholderFavoriteCard, CARD_W, GAP, CARD_STEP } from "./FavoriteCard";

export function FavoritesCarousel({ favorites, onSelect, onAddNew }) {
  const outerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const measure = () => setContainerWidth(outerRef.current?.offsetWidth || window.innerWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Build the base slide list, padded with placeholders so the loop is always full enough.
  const visibleCount    = containerWidth ? Math.max(1, Math.ceil(containerWidth / CARD_STEP)) : 2;
  const minSlides       = Math.max(visibleCount * 2, 3);
  const placeholderCount = Math.max(0, minSlides - favorites.length);

  const baseSlides = [
    ...favorites.map(r  => ({ type: "recipe",      id: String(r.id), recipe: r })),
    ...Array.from({ length: placeholderCount }, (_, i) => ({ type: "placeholder", id: `placeholder-${i}` })),
  ];
  const n = baseSlides.length;

  // Triple the list for infinite-loop illusion.
  const loopSlides = [...baseSlides, ...baseSlides, ...baseSlides];

  const [active,       setActive]       = useState(n);
  const [transitioning, setTransitioning] = useState(false);
  const [dragOffset,   setDragOffset]   = useState(0);

  const startX    = useRef(null);
  const lastX     = useRef(0);
  const velocity  = useRef(0);
  const dragging  = useRef(false);
  const dragDelta = useRef(0);

  // Re-center when slide count changes (favorite added/removed).
  useEffect(() => { setTransitioning(false); setActive(n); }, [n]);

  if (!favorites.length) return null;

  const goTo = idx => { setDragOffset(0); setTransitioning(true); setActive(idx); };

  // After snap, silently re-center into the middle copy of the loop.
  const handleTransitionEnd = e => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    setTransitioning(false);
    if (active >= n * 2) setActive(active - n);
    else if (active < n) setActive(active + n);
  };

  const onDown = e => {
    startX.current  = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    lastX.current   = startX.current;
    dragging.current  = true;
    dragDelta.current = 0;
    velocity.current  = 0;
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
    const move = dragDelta.current;
    const v    = velocity.current;
    const threshold = CARD_W * 0.25;
    let next = active;
    if (move < -threshold || v < -5) next = active + 1;
    else if (move > threshold || v > 5) next = active - 1;
    goTo(next);
  };

  const activeDot = ((active % n) + n) % n;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>
          Your Favorites
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
            transform: `translateX(calc(${-active * CARD_STEP}px + ${dragOffset}px))`,
            transition: transitioning ? "transform 0.32s cubic-bezier(0.25, 1, 0.35, 1)" : "none",
            cursor: "grab", userSelect: "none",
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
              />
            ) : (
              <PlaceholderFavoriteCard
                key={`${copyIdx}-${slide.id}`}
                active={isActive}
                onAddNew={onAddNew}
                dragDelta={dragDelta}
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
