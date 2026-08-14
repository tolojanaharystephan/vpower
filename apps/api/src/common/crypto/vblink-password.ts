import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function encryptionKey(): Buffer {
  const raw = process.env.VBLINK_ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    throw new Error('VBLINK_ENCRYPTION_KEY must be at least 32 characters');
  }
  if (/^[0-9a-f]{64}$/i.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  return createHash('sha256').update(raw, 'utf8').digest();
}

/** AES-256-GCM. Stored as iv:authTag:ciphertext (base64). */
export function encryptVblinkPassword(plain: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, encryptionKey(), iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptVblinkPassword(encrypted: string): string {
  const parts = encrypted.split(':');
  const ivB64 = parts[0];
  const tagB64 = parts[1];
  const dataB64 = parts[2];
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid VBlink password payload');
  }
  const decipher = createDecipheriv(ALGO, encryptionKey(), Buffer.from(ivB64, 'base64'), {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
