import { normalizePlus100BaseUrl } from './plus100-url';

describe('normalizePlus100BaseUrl', () => {
  it('strips trailing slash and /b so we do not call /b/b/method', () => {
    expect(normalizePlus100BaseUrl('https://api.100plus.me/b/')).toBe('https://api.100plus.me');
    expect(normalizePlus100BaseUrl('https://api.100plus.me/b')).toBe('https://api.100plus.me');
    expect(normalizePlus100BaseUrl('https://api.100plus.me')).toBe('https://api.100plus.me');
  });
});
