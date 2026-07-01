// ── Postgres-safe string sanitization ─────────────────────────────────────────
// Postgres text/jsonb columns reject embedded NUL bytes outright — pasted text
// from some sources (old documents, PDFs, scraped pages) can carry one
// invisibly, and the write then fails with "invalid byte sequence for
// encoding UTF8: 0x00". Stripping it before anything reaches Supabase means a
// save can't silently fail (or half-apply) for a reason the user has no way to
// see or fix.
export function stripNullBytes(value) {
  if (typeof value === "string") return value.replace(/\0/g, "");
  if (Array.isArray(value)) return value.map(stripNullBytes);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = stripNullBytes(v);
    return out;
  }
  return value;
}
