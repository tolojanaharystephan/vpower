import { createHash, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';

/** Request timestamp in milliseconds (PDF). */
export function generateTimestamp(): string {
  return String(Date.now());
}

/** Unique request id (PDF: up to 64 alphanumeric). */
export function generateRequestId(): string {
  return randomUUID().replace(/-/g, '');
}

/**
 * VBlink FastAPI request signature (PDF):
 * 1. Exclude `sign`
 * 2. Sort remaining keys alphabetically
 * 3. Concatenate key=value joined by &
 * 4. Append VBLINK_APP_SECRET (unless skipSecret — agent/login only)
 * 5. MD5 hex
 */
@Injectable()
export class VblinkSignatureService {
  constructor(private readonly config: AppConfigService) {}

  sign(params: Record<string, unknown>, skipSecret = false): string {
    const appSecret = this.config.vblink.appSecret;
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

  generateTimestamp(): string {
    return generateTimestamp();
  }

  generateRequestId(): string {
    return generateRequestId();
  }
}
