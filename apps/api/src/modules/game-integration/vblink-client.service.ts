import {
  BadGatewayException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import {
  isVblinkSuccessCode,
  toGatewayIfUnknown,
  VBLINK_ERROR_MESSAGES,
  VblinkApiException,
  VblinkUpstreamBlockedException,
} from './vblink/vblink-errors';
import {
  assertVblinkAccountFormat,
  assertVblinkPasswordFormat,
} from './vblink/vblink-sign.util';
import { VblinkSignatureService } from './vblink-signature.service';

type FastApiResponse<T> = {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
};

export type CreatePlayerResult = {
  fullAccount?: string;
  code: number;
  alreadyExists: boolean;
};

@Injectable()
export class VblinkClientService implements OnModuleInit {
  private readonly logger = new Logger(VblinkClientService.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly signature: VblinkSignatureService,
  ) {}

  onModuleInit() {
    if (!this.isConfigured()) return;
    try {
      const apiHost = new URL(this.config.vblink.apiBaseUrl).hostname.replace(/^www\./, '');
      const lobbyHost = new URL(this.config.vblink.lobbyUrl).hostname.replace(/^www\./, '');
      if (apiHost === lobbyHost) {
        this.logger.warn(
          `VBLINK_API_BASE_URL is ${this.config.vblink.apiBaseUrl} (same host as Game Mainpage). ` +
            `FastAPI /fast/user/* lives on a separate API Server Domain — Cloudflare will return HTTP 403 HTML until that URL is set and this IP is whitelisted.`,
        );
      }
    } catch {
      /* ignore invalid URL at boot */
    }
  }

  isConfigured(): boolean {
    const c = this.config.vblink;
    return Boolean(c.enabled && c.apiBaseUrl && c.appId && c.appSecret);
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'VBlink is not configured. Set VBLINK_ENABLED=true, VBLINK_APP_ID, VBLINK_APP_SECRET, VBLINK_API_BASE_URL.',
      );
    }
  }

  async createPlayer(account: string, passwd: string): Promise<CreatePlayerResult> {
    assertVblinkAccountFormat(account);
    assertVblinkPasswordFormat(passwd);
    try {
      const data = await this.post<{ full_account?: string }>('/fast/user/create', {
        account,
        passwd,
      });
      return {
        fullAccount: data?.full_account,
        code: 1,
        alreadyExists: false,
      };
    } catch (err) {
      // PDF code 12 = User Already Exist — treat as success for ensureVblinkAccount
      if (err instanceof VblinkApiException && err.vblinkCode === 12) {
        return { code: 12, alreadyExists: true };
      }
      throw err;
    }
  }

  async deposit(account: string, amount: number): Promise<{ balance?: number; orderNum?: string }> {
    const data = await this.post<{ balance?: number; order_num?: string }>('/fast/user/deposit', {
      account,
      amount: amount.toFixed(2),
    });
    return { balance: data?.balance, orderNum: data?.order_num };
  }

  async withdrawal(
    account: string,
    amount: number,
  ): Promise<{ balance?: number; orderNum?: string }> {
    const data = await this.post<{ balance?: number; order_num?: string }>('/fast/user/withdrawal', {
      account,
      amount: amount.toFixed(2),
    });
    return { balance: data?.balance, orderNum: data?.order_num };
  }

  async getBalance(account: string): Promise<number | undefined> {
    const data = await this.post<{ balance?: number }>('/fast/user/balance', { account });
    return data?.balance;
  }

  async getGameLogList(account: string): Promise<unknown> {
    return this.post('/fast/user/gameLogList', { account });
  }

  async resetPassword(account: string, newPasswd: string): Promise<void> {
    assertVblinkAccountFormat(account);
    assertVblinkPasswordFormat(newPasswd);
    await this.post('/fast/user/resetPasswd', { account, new_passwd: newPasswd });
  }

  /**
   * POST form-urlencoded to VBlink FastAPI.
   * Success = code 200 or 1 (PDF). Other codes → Nest exception with PDF mapping.
   */
  private async post<T>(
    path: string,
    params: Record<string, unknown>,
    skipSecretInSign = false,
  ): Promise<T | undefined> {
    this.assertConfigured();
    const c = this.config.vblink;

    const body: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      body[key] = String(value);
    }
    body.appid = c.appId;
    body.timestamp = this.signature.generateTimestamp();
    body.requestid = this.signature.generateRequestId();
    body.sign = this.signature.sign(body, skipSecretInSign);

    const url = `${c.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    this.logger.log(`Vblink request ${path} requestid=${body.requestid} (secrets redacted)`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), c.timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams(body),
        signal: controller.signal,
      });

      const raw = await res.text();
      let json: FastApiResponse<T>;
      try {
        json = JSON.parse(raw) as FastApiResponse<T>;
      } catch {
        const snippet = raw.replace(/\s+/g, ' ').trim().slice(0, 80);
        this.logger.error(`Vblink error ${path} non-JSON HTTP ${res.status}: ${snippet}`);
        const looksLikeCloudflare =
          /cloudflare|Attention Required|cf-error|Just a moment|<!DOCTYPE html/i.test(raw);
        if (looksLikeCloudflare || res.status === 403) {
          throw new VblinkUpstreamBlockedException(url, res.status);
        }
        throw new BadGatewayException(
          `VBlink API returned non-JSON (HTTP ${res.status}) from ${c.apiBaseUrl}${path}`,
        );
      }

      const code = Number(json.code);
      this.logger.log(`Vblink response code ${code} for ${path}`);
      const hint = VBLINK_ERROR_MESSAGES[code] || `VBlink error ${code}`;
      const message = json.msg || json.message || hint;

      if (isVblinkSuccessCode(code)) {
        return json.data;
      }

      this.logger.warn(`Vblink error ${path} code=${code} msg=${message}`);
      throw new VblinkApiException(code, message);
    } catch (err) {
      return toGatewayIfUnknown(err);
    } finally {
      clearTimeout(timer);
    }
  }
}
