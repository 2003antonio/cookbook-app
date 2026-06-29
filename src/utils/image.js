// ── Image file reader ─────────────────────────────────────────────────────────
// Reads an image File and returns a compressed data-URL string, downscaling so
// the longest edge is at most `maxDim` px. Recipe photos are stored inline on
// the recipe row (no separate storage bucket), so keeping the payload small
// matters — a 1280px JPEG at ~0.82 quality is plenty for a cover image while
// staying a few hundred KB at most.
export function readImageFile(file, { maxDim = 1280, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided"));
    if (!file.type.startsWith("image/")) return reject(new Error("Please choose an image file"));

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That image could not be loaded"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        // Re-encode as JPEG to shrink the payload. Recipe photos are opaque, so
        // dropping the alpha channel is fine. Fall back to the original data URL
        // if the canvas export is blocked for any reason.
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          resolve(reader.result);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
