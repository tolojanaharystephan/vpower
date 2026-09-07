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
} from '../game-integration/vblink/vblink-errors';
import {
  assertVblinkAccountFormat,
  assertVblinkPasswordFormat,
} from '../game-integration/vblink/vblink-sign.util';
import { VblinkSignatureService } from '../game-integration/vblink-signature.service';

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

/** Dragon Fury uses the same FastAPI contract as VBlink. */
@Injectable()
export class DragonfuryClientService implements OnModuleInit {
  private readonly logger = new Logger(DragonfuryClientService.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly signature: VblinkSignatureService,
  ) {}

  onModuleInit() {
    if (!this.isConfigured()) return;
    try {
      const apiHost = new URL(this.config.dragonfury.apiBaseUrl).hostname.replace(/^www\./, '');
      const lobbyHost = new URL(this.config.dragonfury.lobbyUrl).hostname.replace(/^www\./, '');
      if (apiHost === lobbyHost) {
        this.logger.warn(
          `DRAGONFURY_API_BASE_URL is ${this.config.dragonfury.apiBaseUrl} (same host as Game Mainpage). ` +
            `FastAPI /fast/user/* lives on a separate API Server Domain.`,
        );
      }
    } catch {
      /* ignore */
    }
  }

  isConfigured(): boolean {
    const c = this.config.dragonfury;
    return Boolean(c.enabled && c.apiBaseUrl && c.appId && c.appSecret);
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Dragon Fury is not configured. Set DRAGONFURY_ENABLED=true, DRAGONFURY_APP_ID, DRAGONFURY_APP_SECRET, DRAGONFURY_API_BASE_URL.',
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
      if (err instanceof VblinkApiException && err.vblinkCode === 12) {
        return { code: 12, alreadyExists: true };
      }
      throw err;
    }
  }

  async resetPassword(account: string, newPasswd: string): Promise<void> {
    assertVblinkAccountFormat(account);
    assertVblinkPasswordFormat(newPasswd);
    await this.post('/fast/user/resetPasswd', { account, new_passwd: newPasswd });
  }

  async deposit(account: string, amount: number): Promise<{ balance?: number; orderNum?: string }> {
    const data = await this.post<{ balance?: number; order_num?: string }>('/fast/user/deposit', {
      account,
      amount: amount.toFixed(2),
    });
    return { balance: data?.balance, orderNum: data?.order_num };
  }

  async getBalance(account: string): Promise<number | undefined> {
    const data = await this.post<{ balance?: number }>('/fast/user/balance', { account });
    return data?.balance;
  }

  private async post<T>(
    path: string,
    params: Record<string, unknown>,
    skipSecretInSign = false,
  ): Promise<T | undefined> {
    this.assertConfigured();
    const c = this.config.dragonfury;

    const body: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      body[key] = String(value);
    }
    body.appid = c.appId;
    body.timestamp = this.signature.generateTimestamp();
    body.requestid = this.signature.generateRequestId();
    body.sign = this.signature.sign(body, skipSecretInSign, c.appSecret);

    const url = `${c.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    this.logger.log(`DragonFury request ${path} requestid=${body.requestid}`);

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
        this.logger.error(`DragonFury error ${path} non-JSON HTTP ${res.status}: ${snippet}`);
        const looksLikeCloudflare =
          /cloudflare|Attention Required|cf-error|Just a moment|<!DOCTYPE html/i.test(raw);
        if (looksLikeCloudflare || res.status === 403) {
          throw new VblinkUpstreamBlockedException(url, res.status);
        }
        throw new BadGatewayException(
          `Dragon Fury API returned non-JSON (HTTP ${res.status}) from ${c.apiBaseUrl}${path}`,
        );
      }

      const code = Number(json.code);
      const detail =
        json.data &&
        typeof json.data === 'object' &&
        'info' in json.data &&
        typeof (json.data as { info?: unknown }).info === 'string'
          ? (json.data as { info: string }).info
          : '';
      const hint = VBLINK_ERROR_MESSAGES[code] || `Dragon Fury error ${code}`;
      const message = detail || json.msg || json.message || hint;

      if (isVblinkSuccessCode(code)) {
        return json.data;
      }

      this.logger.warn(`DragonFury error ${path} code=${code} msg=${message}`);
      throw new VblinkApiException(code, message);
    } catch (err) {
      return toGatewayIfUnknown(err);
    } finally {
      clearTimeout(timer);
    }
  }
}
