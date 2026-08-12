import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadGatewayException,
} from '@nestjs/common';
import { AppConfigService } from '../../../config/app-config.service';
import { vblinkRequestId, vblinkSign } from './vblink-sign';

type FastApiResponse<T> = {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
};

@Injectable()
export class VblinkApiClient {
  private readonly logger = new Logger(VblinkApiClient.name);

  constructor(private readonly config: AppConfigService) {}

  isConfigured(): boolean {
    const c = this.config.vblink;
    return Boolean(c.enabled && c.apiBaseUrl && c.appId && c.appSecret);
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'VBlink is not configured. Set VBLINK_ENABLED=true, VBLINK_API_BASE_URL (API Server Domain from the FastAPI PDF), VBLINK_APP_ID, and VBLINK_APP_SECRET.',
      );
    }
  }

  /** Create player — codes 200 / 1 (created) / 12 (already exists) are OK. */
  async createPlayer(account: string, passwd: string): Promise<{ fullAccount?: string }> {
    const data = await this.postForm<{ full_account?: string }>('/fast/user/create', {
      account,
      passwd,
    });
    return { fullAccount: data?.full_account };
  }

  async getBalance(account: string): Promise<number | undefined> {
    const data = await this.postForm<{ balance?: number }>('/fast/user/balance', { account });
    return data?.balance;
  }

  private async postForm<T>(
    path: string,
    extra: Record<string, string>,
  ): Promise<T | undefined> {
    this.assertConfigured();
    const c = this.config.vblink;
    const body: Record<string, string> = {
      requestid: vblinkRequestId(),
      appid: c.appId,
      timestamp: String(Date.now()),
      ...extra,
    };
    body.sign = vblinkSign(body, c.appSecret);

    const url = `${c.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), c.timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(body),
        signal: controller.signal,
      });
      const json = (await res.json()) as FastApiResponse<T>;
      const code = Number(json.code);
      const message = json.msg || json.message || `VBlink error ${code}`;

      // PDF: 200 success; 1 new user; 12 already exists (idempotent create)
      if (code === 200 || code === 1 || (path.includes('/create') && code === 12)) {
        return json.data;
      }

      this.logger.warn(`VBlink ${path} failed code=${code} msg=${message}`);
      throw new BadGatewayException(`VBlink API: ${message} (code ${code})`);
    } catch (err) {
      if (err instanceof BadGatewayException || err instanceof ServiceUnavailableException) {
        throw err;
      }
      this.logger.error(`VBlink ${path} request error`, err instanceof Error ? err.stack : err);
      throw new BadGatewayException(
        'VBlink API unreachable — check VBLINK_API_BASE_URL and IP whitelist',
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
