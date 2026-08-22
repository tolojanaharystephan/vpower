import { Logger } from '@nestjs/common';
import { Plus100ApiClient } from './plus100-api-client.service';
import { Plus100ApiException } from './plus100-errors';
import type { AppConfigService } from '../../config/app-config.service';
import { encodePhpUnescapedJson, generateHash } from './utils/hash.util';

function mockConfig(): AppConfigService {
  return {
    plus100: {
      baseUrl: 'https://api.100plus.test',
      agentId: 'very',
      secretKey: 'SecretKey',
    },
  } as AppConfigService;
}

describe('Plus100ApiClient.post', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('builds the URL, hash, and PHP-unescaped JSON body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify({ status: 'ok' }),
    }) as unknown as typeof fetch;

    const body = { message: 'Hello World!', url: 'https://100plus.example/path', name: '游戏' };
    const client = new Plus100ApiClient(mockConfig());
    await client.post('echo', body);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const url = new URL(calledUrl);
    const expectedBody = encodePhpUnescapedJson(body);

    expect(url.origin + url.pathname).toBe('https://api.100plus.test/b/echo');
    expect(url.searchParams.get('from')).toBe('very');
    expect(url.searchParams.get('secret')).toBe('SecretKey');
    expect(url.searchParams.get('hash')).toBe(generateHash(body, 'very', 'SecretKey'));

    expect(init.method).toBe('POST');
    expect(init.headers).toEqual(
      expect.objectContaining({
        'Content-Type': 'application/json; charset=utf-8',
      }),
    );
    expect(init.body).toBe(expectedBody);
    expect(init.body).toBe('{"message":"Hello World!","url":"https://100plus.example/path","name":"游戏"}');
  });

  it('matches the official documentation hash when the body is the sample payload', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify({ status: 'ok' }),
    }) as unknown as typeof fetch;

    const body = { message: 'Hello World!' };
    const client = new Plus100ApiClient(mockConfig());
    await client.post('echo', body);

    const [calledUrl, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const url = new URL(calledUrl);

    expect(url.searchParams.get('hash')).toBe(
      '514acab8e3ff3f6b7562e8b6ef44141d21e90d7aa19002a38314ecc9fbce2553',
    );
    expect(init.body).toBe(encodePhpUnescapedJson(body));
  });

  it('throws and logs code + action on a 100Plus error body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      text: async () =>
        JSON.stringify({
          status: 'error',
          code: 'E001',
          message: 'denied',
          action: 'retry',
        }),
    }) as unknown as typeof fetch;

    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const client = new Plus100ApiClient(mockConfig());

    const err = await client.post('echo', { message: 'Hello World!' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(Plus100ApiException);
    expect(err).toMatchObject({ plus100Code: 'E001', action: 'retry' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('code=E001 action=retry'));
  });
});
