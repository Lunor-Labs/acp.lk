const API = (import.meta.env.VITE_API_BASE_URL || '')
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');
const MEDIA_BASE = `${API || 'https://api.acp.lk'}/media`;

/** Turns a DB value (bare path, "acp/..." path, or old Supabase URL) into a working media URL. */
export function mediaUrl(value?: string | null): string {
  if (!value) return '';

  // old Supabase URL, or the broken acp.lk/storage/... form
  const m = value.match(/\/storage\/v1\/object\/public\/acp\/(.+)$/);
  if (m) return `${MEDIA_BASE}/${m[1]}`;

  // already a full URL
  if (/^https?:\/\//i.test(value)) return value;

  // "acp/questions/images/x.png" or "questions/images/x.png"
  return `${MEDIA_BASE}/${value.replace(/^\/+/, '').replace(/^acp\//, '')}`;
}