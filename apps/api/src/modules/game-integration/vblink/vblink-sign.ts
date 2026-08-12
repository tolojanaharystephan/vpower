import { createHash, randomBytes } from 'node:crypto';

/** FastAPI request signature (PDF): sort key=value by key, join with &, append appsecret, MD5. */
export function vblinkSign(
  params: Record<string, string | number | boolean>,
  appSecret: string,
  options?: { appendSecret?: boolean },
): string {
  const appendSecret = options?.appendSecret !== false;
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key === 'sign' || value === undefined || value === null) continue;
    if (typeof value === 'boolean') {
      normalized[key] = value ? 'true' : 'false';
    } else {
      normalized[key] = String(value);
    }
  }
  const keys = Object.keys(normalized).sort();
  const joined = keys.map((k) => `${k}=${normalized[k]}`).join('&');
  const payload = appendSecret ? `${joined}${appSecret}` : joined;
  return createHash('md5').update(payload, 'utf8').digest('hex');
}

export function vblinkRequestId(): string {
  return `${Date.now()}${randomBytes(4).toString('hex')}`.slice(0, 64);
}

/** Stable 3–16 alphanumeric account from our user id. */
export function vblinkAccountForUser(userId: string): string {
  const compact = userId.replace(/-/g, '').toLowerCase();
  return `vp${compact.slice(0, 14)}`;
}

/** Password: 6–16 chars, letters + numbers (PDF rules). */
export function vblinkPasswordForUser(userId: string, appSecret: string): string {
  const digest = createHash('sha256').update(`${appSecret}:${userId}`).digest('hex');
  return `Vp${digest.slice(0, 10)}1`;
}
