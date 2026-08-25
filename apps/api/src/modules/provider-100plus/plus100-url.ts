/** `{100plus url}` may be given as `https://host/b/` — we always append `/b/{method}` ourselves. */
export function normalizePlus100BaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '').replace(/\/b$/i, '');
}
