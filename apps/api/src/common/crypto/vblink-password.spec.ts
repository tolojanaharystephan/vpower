import { decryptVblinkPassword, encryptVblinkPassword } from './vblink-password';

describe('vblink-password AES-256-GCM', () => {
  beforeAll(() => {
    process.env.VBLINK_ENCRYPTION_KEY = 'b'.repeat(64);
  });

  it('round-trips a password', () => {
    const plain = 'Vp123456a1!@';
    const encrypted = encryptVblinkPassword(plain);
    expect(encrypted).not.toContain(plain);
    expect(decryptVblinkPassword(encrypted)).toBe(plain);
  });

  it('produces different ciphertexts for the same input', () => {
    const a = encryptVblinkPassword('same-pass-12ab');
    const b = encryptVblinkPassword('same-pass-12ab');
    expect(a).not.toBe(b);
  });
});
