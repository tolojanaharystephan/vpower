import {
  BadGatewayException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import {
  isPlus100ErrorBody,
  Plus100ApiException,
  toPlus100GatewayIfUnknown,
} from './plus100-errors';
import { encodePhpUnescapedJson, generateHash } from './utils/hash.util';

const PLUS100_TIMEOUT_MS = 15_000;

@Injectable()
export class Plus100ApiClient {
  private readonly logger = new Logger(Plus100ApiClient.name);

  constructor(private readonly config: AppConfigService) {}

  isConfigured(): boolean {
    const c = this.config.plus100;
    return Boolean(c.baseUrl && c.agentId && c.secretKey);
  }

  async post<T = unknown>(method: string, body: object): Promise<T> {
    this.assertConfigured();
    const { baseUrl, agentId, secretKey } = this.config.plus100;
    // Hash and HTTP body MUST use the same PHP-style JSON (JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES).
    const payload = encodePhpUnescapedJson(body);
    const hash = generateHash(body, agentId, secretKey);
    const url = this.buildUrl(baseUrl, method, hash, agentId, secretKey);

    this.logger.log(`100Plus request ${method} (secrets redacted)`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PLUS100_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'application/json',
        },
        body: payload,
        signal: controller.signal,
      });

      const raw = await res.text();
      let json: unknown;
      try {
        json = JSON.parse(raw) as unknown;
      } catch {
        const snippet = raw.replace(/\s+/g, ' ').trim().slice(0, 80);
        this.logger.error(`100Plus error ${method} non-JSON HTTP ${res.status}: ${snippet}`);
        throw new BadGatewayException({
          statusCode: HttpStatus.BAD_GATEWAY,
          code: 'PLUS100_BAD_GATEWAY',
          message: `100Plus API returned non-JSON (HTTP ${res.status})`,
        });
      }

      if (isPlus100ErrorBody(json)) {
        const code = json.code;
        const action = json.action;
        const message = json.message || `100Plus error ${code ?? 'unknown'}`;
        this.logger.warn(`100Plus error ${method} code=${code} action=${action}`);
        throw new Plus100ApiException(code, action, message);
      }

      return json as T;
    } catch (err) {
      return toPlus100GatewayIfUnknown(err);
    } finally {
      clearTimeout(timer);
    }
  }

  private assertConfigured() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        '100Plus is not configured. Set PLUS100_API_URL, PLUS100_AGENT_ID, PLUS100_SECRET_KEY.',
      );
    }
  }

  private buildUrl(
    baseUrl: string,
    method: string,
    hash: string,
    agentId: string,
    secretKey: string,
  ): string {
    const url = new URL(`${baseUrl}/b/${method}`);
    url.searchParams.set('hash', hash);
    url.searchParams.set('from', agentId);
    url.searchParams.set('secret', secretKey);
    return url.toString();
  }
}
