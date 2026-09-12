import { toCents } from './dgames-callback.service';

describe('DGames toCents', () => {
  it('parses decimal dollars to cents', () => {
    expect(toCents('1000.00')).toBe(100000);
    expect(toCents('0.20')).toBe(20);
    expect(toCents(100)).toBe(10000);
    expect(toCents('')).toBe(0);
    expect(toCents(undefined)).toBe(0);
  });
});
