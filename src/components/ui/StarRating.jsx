import { useState } from "react";

export function StarRating({ rating, interactive = false, onChange, size = "md" }) {
  const [hover, setHover] = useState(0);
  const sz = size === "sm" ? "12px" : size === "lg" ? "20px" : "15px";

  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          style={{
            fontSize: sz,
            color: s <= (interactive ? hover || rating : rating) ? "#E8621A" : "#D4D4D0",
            cursor: interactive ? "pointer" : "default",
            transition: "color 0.1s",
            userSelect: "none",
          }}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange?.(s)}
        >★</span>
      ))}
    </div>
  );
}
