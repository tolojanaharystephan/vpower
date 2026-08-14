import { createHash, randomUUID } from 'node:crypto';

/**
 * FastAPI PDF signature (pure): exclude sign → sort keys → key=value&… → append secret → MD5 hex.
 * Arrays/objects are JSON-stringified (PDF sample).
 */
export function computeVblinkSign(
  params: Record<string, unknown>,
  appSecret: string,
  skipSecret = false,
): string {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key === 'sign' || value === undefined || value === null) continue;
    if (typeof value === 'boolean') {
      normalized[key] = value ? 'true' : 'false';
    } else if (typeof value === 'object') {
      normalized[key] = JSON.stringify(value);
    } else {
      normalized[key] = String(value);
    }
  }
  const keys = Object.keys(normalized).sort();
  const joined = keys.map((k) => `${k}=${normalized[k]}`).join('&');
  const payload = skipSecret ? joined : `${joined}${appSecret}`;
  return createHash('md5').update(payload, 'utf8').digest('hex');
}

/** Unique alphanumeric request id (≤64), no dashes — PDF constraint. */
export function computeVblinkRequestId(): string {
  return randomUUID().replace(/-/g, '');
}

export function computeVblinkTimestamp(): string {
  return String(Date.now());
}

/** Stable 3–16 alphanumeric local account from user UUID. */
export function computeVblinkAccountForUser(userId: string): string {
  const compact = userId.replace(/-/g, '').toLowerCase();
  return `vp${compact.slice(0, 14)}`;
}

/**
 * Deterministic technical password (letters+digits, 6–16).
 * Derived from appSecret+userId so we never need to return or store plaintext to the client.
 */
export function computeVblinkPasswordForUser(userId: string, appSecret: string): string {
  const digest = createHash('sha256').update(`${appSecret}:${userId}`).digest('hex');
  return `Vp${digest.slice(0, 10)}1`;
}

export function assertVblinkAccountFormat(account: string) {
  if (!/^[a-zA-Z0-9]{3,16}$/.test(account)) {
    throw new Error('VBlink account must be 3–16 alphanumeric characters');
  }
}

export function assertVblinkPasswordFormat(passwd: string) {
  if (passwd.length < 6 || passwd.length > 16) {
    throw new Error('VBlink password length must be 6–16');
  }
  if (!/[a-zA-Z]/.test(passwd) || !/[0-9]/.test(passwd)) {
    throw new Error('VBlink password must include letters and numbers');
  }
  if (!/^[a-zA-Z0-9!@#$()%^/.,]+$/.test(passwd)) {
    throw new Error('VBlink password contains disallowed characters');
  }
}
