export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 100);

export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "—");
