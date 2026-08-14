import { createHash } from 'node:crypto';
import {
  assertVblinkAccountFormat,
  assertVblinkPasswordFormat,
  computeVblinkAccountForUser,
  computeVblinkPasswordForUser,
  computeVblinkRequestId,
  computeVblinkSign,
  computeVblinkTimestamp,
} from './vblink-sign.util';

describe('computeVblinkSign (PDF)', () => {
  const secret = 'test-secret';

  it('sorts keys alphabetically and appends secret', () => {
    const sign = computeVblinkSign(
      { timestamp: '2', appid: 'a1', requestid: 'r1', account: 'abc' },
      secret,
    );
    const expected = createHash('md5')
      .update('account=abc&appid=a1&requestid=r1&timestamp=2test-secret', 'utf8')
      .digest('hex');
    expect(sign).toBe(expected);
  });

  it('excludes sign from the payload', () => {
    const without = computeVblinkSign({ a: '1', b: '2' }, secret);
    const withSign = computeVblinkSign({ a: '1', b: '2', sign: 'deadbeef' }, secret);
    expect(withSign).toBe(without);
  });

  it('skips secret when skipSecret=true', () => {
    const sign = computeVblinkSign({ a: '1' }, secret, true);
    const expected = createHash('md5').update('a=1', 'utf8').digest('hex');
    expect(sign).toBe(expected);
  });

  it('normalizes booleans', () => {
    const sign = computeVblinkSign({ flag: true }, secret);
    const expected = createHash('md5').update('flag=truetest-secret', 'utf8').digest('hex');
    expect(sign).toBe(expected);
  });

  it('json-stringifies objects', () => {
    const sign = computeVblinkSign({ meta: { x: 1 } }, secret);
    const expected = createHash('md5')
      .update(`meta=${JSON.stringify({ x: 1 })}test-secret`, 'utf8')
      .digest('hex');
    expect(sign).toBe(expected);
  });
});

describe('request helpers', () => {
  it('generateTimestamp is milliseconds digits', () => {
    const ts = computeVblinkTimestamp();
    expect(ts).toMatch(/^\d{13}$/);
  });

  it('generateRequestId is alphanumeric without dashes and ≤64', () => {
    const id = computeVblinkRequestId();
    expect(id).toMatch(/^[a-zA-Z0-9]+$/);
    expect(id.length).toBeLessThanOrEqual(64);
    expect(id.includes('-')).toBe(false);
  });

  it('accountForUser is 3–16 alphanumeric', () => {
    const account = computeVblinkAccountForUser('550e8400-e29b-41d4-a716-446655440000');
    expect(account).toMatch(/^[a-zA-Z0-9]{3,16}$/);
    expect(() => assertVblinkAccountFormat(account)).not.toThrow();
  });

  it('passwordForUser meets PDF constraints', () => {
    const pass = computeVblinkPasswordForUser('user-1', 'test-secret');
    expect(() => assertVblinkPasswordFormat(pass)).not.toThrow();
  });
});
