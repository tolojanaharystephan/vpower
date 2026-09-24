import { createHash, createHmac } from 'node:crypto';
import {
  isWebhookTimestampFresh,
  signAllscaleRequest,
  verifyAllscaleWebhookSignature,
} from './allscale-signing';

describe('allscale-signing', () => {
  const secret = 'test_secret';

  it('signs outbound requests deterministically', () => {
    const signed = signAllscaleRequest({
      apiSecret: secret,
      method: 'POST',
      path: '/v1/checkout_intents/',
      query: '',
      body: '{"amount_cents":100}',
      timestamp: '1716501000',
      nonce: 'nonce-1',
    });
    const bodyHash = createHash('sha256').update('{"amount_cents":100}', 'utf8').digest('hex');
    const canonical = ['POST', '/v1/checkout_intents/', '', '1716501000', 'nonce-1', bodyHash].join(
      '\n',
    );
    const expected = createHmac('sha256', secret).update(canonical, 'utf8').digest('base64');
    expect(signed.signatureHeader).toBe(`v1=${expected}`);
  });

  it('verifies webhook signatures', () => {
    const rawBody = Buffer.from('{"order_id":"vp_1"}', 'utf8');
    const bodySha = createHash('sha256').update(rawBody).digest('hex');
    const canonical = [
      'allscale:webhook:v1',
      'POST',
      '/api/v1/payments/allscale/webhook',
      '',
      'whk_1',
      '1716501000',
      'nonce-2',
      bodySha,
    ].join('\n');
    const signature = createHmac('sha256', secret).update(canonical, 'utf8').digest('base64');
    expect(
      verifyAllscaleWebhookSignature({
        apiSecret: secret,
        method: 'POST',
        path: '/api/v1/payments/allscale/webhook',
        query: '',
        webhookId: 'whk_1',
        timestamp: '1716501000',
        nonce: 'nonce-2',
        rawBody,
        signatureHeader: `v1=${signature}`,
      }),
    ).toBe(true);
  });

  it('rejects stale timestamps', () => {
    expect(isWebhookTimestampFresh('1', 1_716_501_000)).toBe(false);
    expect(isWebhookTimestampFresh(String(1_716_501_000), 1_716_501_000)).toBe(true);
  });
});
