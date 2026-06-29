import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// The backdrop is provided by App.js — this component only animates the icon.
export function RecipeTransitionLoader({ phase }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 201,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        className={`loader-${phase}`}
        style={{ filter: "hue-rotate(-95deg) saturate(1.8) brightness(1.05)" }}
      >
        <DotLottieReact
          src="https://lottie.host/ad12a4bb-28ef-4f68-b4ff-cda5575b481c/rfPnYTyrZ3.lottie"
          loop
          autoplay
          style={{ width: 160, height: 160 }}
        />
      </div>
    </div>
  );
}
