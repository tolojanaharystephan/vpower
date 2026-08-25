import { randomPlus100Password, plus100Lang, assertPlus100Password } from './plus100-password';

describe('plus100 password + lang', () => {
  it('generates a password that matches API 5.0 rules', () => {
    const password = randomPlus100Password();
    expect(() => assertPlus100Password(password)).not.toThrow();
    expect(password.length).toBeGreaterThanOrEqual(6);
    expect(password.length).toBeLessThanOrEqual(20);
  });

  it('maps locales to zh-CN / en / th', () => {
    expect(plus100Lang('fr')).toBe('en');
    expect(plus100Lang('en-US')).toBe('en');
    expect(plus100Lang('zh')).toBe('zh-CN');
    expect(plus100Lang('th-TH')).toBe('th');
  });
});
