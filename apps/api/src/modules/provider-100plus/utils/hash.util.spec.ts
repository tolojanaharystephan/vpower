import { encodePhpUnescapedJson, generateHash } from './hash.util';

describe('generateHash (100Plus PHP getHash)', () => {
  it('matches the official documentation example', () => {
    const hash = generateHash({ message: 'Hello World!' }, 'very', 'SecretKey');
    expect(hash).toBe('514acab8e3ff3f6b7562e8b6ef44141d21e90d7aa19002a38314ecc9fbce2553');
  });

  it('does not escape slashes or unicode in the HMAC message', () => {
    expect(encodePhpUnescapedJson({ url: 'https://100plus.example/path', name: '游戏' })).toBe(
      '{"url":"https://100plus.example/path","name":"游戏"}',
    );
  });
});
