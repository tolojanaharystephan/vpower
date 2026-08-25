import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

/** 6–20 chars, letters + digits, at least one upper and one lower (API 5.0). */
export function assertPlus100Password(password: string) {
  if (password.length < 6 || password.length > 20) {
    throw new BadRequestException('100Plus password must be 6–20 characters');
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new BadRequestException(
      '100Plus password must mix uppercase, lowercase, and digits',
    );
  }
}

/** Agent account: 7–16 alphanumeric. */
export function assertPlus100AgentAccount(account: string) {
  if (!/^[A-Za-z0-9]{7,16}$/.test(account)) {
    throw new BadRequestException(
      '100Plus agent account must be 7–16 letters and digits',
    );
  }
}

/** `Vp` + 8 digits → 10 chars, guaranteed mixed case + digits. */
export function randomPlus100Password(): string {
  const bytes = randomBytes(8);
  const digits = [...bytes].map((b) => String(b % 10)).join('');
  const password = `Vp${digits}`;
  assertPlus100Password(password);
  return password;
}

export function plus100Lang(locale?: string): 'zh-CN' | 'en' | 'th' {
  const raw = (locale || 'en').toLowerCase();
  if (raw.startsWith('zh')) return 'zh-CN';
  if (raw.startsWith('th')) return 'th';
  return 'en';
}
