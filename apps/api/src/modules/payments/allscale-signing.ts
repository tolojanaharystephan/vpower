import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

/** Outbound AllScale OpenAPI request signing (Auth doc). */
export function signAllscaleRequest(input: {
  apiSecret: string;
  method: string;
  path: string;
  query?: string;
  body: string;
  timestamp?: string;
  nonce?: string;
}): { timestamp: string; nonce: string; signatureHeader: string; bodySha256: string } {
  const timestamp = input.timestamp ?? Math.floor(Date.now() / 1000).toString();
  const nonce = input.nonce ?? randomUUID();
  const bodySha256 = createHash('sha256').update(input.body, 'utf8').digest('hex');
  const canonical = [
    input.method.toUpperCase(),
    input.path,
    input.query ?? '',
    timestamp,
    nonce,
    bodySha256,
  ].join('\n');
  const signature = createHmac('sha256', input.apiSecret).update(canonical, 'utf8').digest('base64');
  return {
    timestamp,
    nonce,
    signatureHeader: `v1=${signature}`,
    bodySha256,
  };
}

/** Verify inbound AllScale webhook signature (Webhook Signing doc). */
export function verifyAllscaleWebhookSignature(input: {
  apiSecret: string;
  method: string;
  path: string;
  query: string;
  webhookId: string;
  timestamp: string;
  nonce: string;
  rawBody: Buffer;
  signatureHeader: string;
}): boolean {
  const match = /^v1=(.+)$/.exec(input.signatureHeader.trim());
  if (!match) return false;
  const provided = match[1];
  const bodySha256 = createHash('sha256').update(input.rawBody).digest('hex');
  const canonical = [
    'allscale:webhook:v1',
    input.method.toUpperCase(),
    input.path,
    input.query ?? '',
    input.webhookId,
    input.timestamp,
    input.nonce,
    bodySha256,
  ].join('\n');
  const expected = createHmac('sha256', input.apiSecret).update(canonical, 'utf8').digest('base64');
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isWebhookTimestampFresh(timestampSec: string, nowSec = Math.floor(Date.now() / 1000)): boolean {
  const ts = Number(timestampSec);
  if (!Number.isFinite(ts)) return false;
  return Math.abs(nowSec - ts) <= 300;
}
