// ── Recipe image storage ──────────────────────────────────────────────────────
// Cover photos live in a public Supabase Storage bucket, NOT inline in the
// recipes table — the row only stores the resulting public URL (a short string).
// This keeps recipe rows tiny and scalable, and Storage's free tier (~1GB) holds
// thousands of downscaled JPEGs.
//
// ONE-TIME SUPABASE SETUP (run once in the SQL editor):
//   insert into storage.buckets (id, name, public)
//   values ('recipe-images', 'recipe-images', true)
//   on conflict (id) do nothing;
//
//   create policy "recipe-images: owner can write"
//     on storage.objects for all to authenticated
//     using      (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = auth.uid()::text)
//     with check (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = auth.uid()::text);
//
// Files are stored at  <userId>/<recipeId>.<ext>  — one image per recipe, so a
// "replace" upserts over the old file and never orphans (within the same ext).

import { supabase } from "./supabaseClient";

const BUCKET = "recipe-images";

// True for inline data URLs produced by the form; false for already-hosted URLs.
export function isDataUrl(str) {
  return typeof str === "string" && str.startsWith("data:");
}

// Decode a base64 data URL into a Blob for upload.
function dataUrlToBlob(dataUrl) {
  const [meta, b64] = dataUrl.split(",");
  const mime  = meta.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const bin   = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

const extFor = (mime) => (mime === "image/png" ? "png" : "jpg");

// Upload a recipe cover photo; returns its public URL, or null on failure.
export async function uploadRecipeImage(userId, recipeId, dataUrl) {
  try {
    const blob = dataUrlToBlob(dataUrl);
    const path = `${userId}/${recipeId}.${extFor(blob.type)}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { upsert: true, contentType: blob.type, cacheControl: "3600" });
    if (error) { console.error("Image upload failed:", error.message); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl || null;
  } catch (err) {
    console.error("Image upload failed:", err?.message || err);
    return null;
  }
}

// Best-effort removal of a recipe's stored image (both possible extensions), so
// deleting or clearing a photo doesn't leave files behind.
export async function deleteRecipeImage(userId, recipeId) {
  if (!userId || !recipeId) return;
  await supabase.storage
    .from(BUCKET)
    .remove([`${userId}/${recipeId}.jpg`, `${userId}/${recipeId}.png`])
    .catch(() => {});
}
