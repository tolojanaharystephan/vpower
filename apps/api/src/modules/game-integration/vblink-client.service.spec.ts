import { VblinkClientService } from './vblink-client.service';
import { VblinkApiException, VblinkUpstreamBlockedException } from './vblink/vblink-errors';
import type { VblinkSignatureService } from './vblink-signature.service';
import type { AppConfigService } from '../../config/app-config.service';

function mockConfig(): AppConfigService {
  return {
    vblink: {
      enabled: true,
      apiBaseUrl: 'https://vblink.test',
      appId: 'appid1',
      appSecret: 'secret1',
      agentAccount: 'AGENT1',
      lobbyUrl: 'https://www.vblink777.club',
      timeoutMs: 5000,
    },
  } as AppConfigService;
}

function mockSignature(): VblinkSignatureService {
  return {
    generateRequestId: () => 'req1',
    generateTimestamp: () => '1700000000000',
    sign: () => 'abc123sign',
  } as unknown as VblinkSignatureService;
}

describe('VblinkClientService.createPlayer', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('treats code 1 as success (new user)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      text: async () =>
        JSON.stringify({ code: 1, data: { full_account: 'AG_vp123' } }),
    }) as unknown as typeof fetch;

    const client = new VblinkClientService(mockConfig(), mockSignature());
    const result = await client.createPlayer('vpabc123', 'Vp123456a1');
    expect(result.alreadyExists).toBe(false);
    expect(result.fullAccount).toBe('AG_vp123');
  });

  it('treats code 12 as already exists (not a hard failure)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify({ code: 12, msg: 'User Already Exist' }),
    }) as unknown as typeof fetch;

    const client = new VblinkClientService(mockConfig(), mockSignature());
    const result = await client.createPlayer('vpabc123', 'Vp123456a1');
    expect(result.code).toBe(12);
    expect(result.alreadyExists).toBe(true);
  });

  it('throws VblinkApiException on invalid signature (code 4)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify({ code: 4, msg: 'Invalid Signature' }),
    }) as unknown as typeof fetch;

    const client = new VblinkClientService(mockConfig(), mockSignature());
    await expect(client.createPlayer('vpabc123', 'Vp123456a1')).rejects.toBeInstanceOf(
      VblinkApiException,
    );
  });

  it('throws VblinkUpstreamBlockedException on Cloudflare HTML 403', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 403,
      text: async () =>
        '<!DOCTYPE html><html><title>Attention Required</title><body>cloudflare</body></html>',
    }) as unknown as typeof fetch;

    const client = new VblinkClientService(mockConfig(), mockSignature());
    await expect(client.createPlayer('vpabc123', 'Vp123456a1')).rejects.toBeInstanceOf(
      VblinkUpstreamBlockedException,
    );
  });

  it('rejects invalid account format before calling API', async () => {
    global.fetch = jest.fn();
    const client = new VblinkClientService(mockConfig(), mockSignature());
    await expect(client.createPlayer('ab', 'Vp123456a1')).rejects.toThrow(/account/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
