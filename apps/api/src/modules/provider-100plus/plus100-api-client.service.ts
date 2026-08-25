import {
  BadGatewayException,
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AppConfigService } from '../../config/app-config.service';
import {
  isPlus100ErrorBody,
  Plus100ApiException,
  toPlus100GatewayIfUnknown,
} from './plus100-errors';
import {
  assertPlus100AgentAccount,
  assertPlus100Password,
  plus100Lang,
} from './plus100-password';
import type {
  Plus100AccountDetails,
  Plus100AddAccountInput,
  Plus100AddAccountResult,
  Plus100EditAccountInput,
  Plus100LaunchResult,
} from './plus100.types';
import { encodePhpUnescapedJson, generateHash } from './utils/hash.util';

const PLUS100_TIMEOUT_MS = 15_000;

@Injectable()
export class Plus100ApiClient {
  private readonly logger = new Logger(Plus100ApiClient.name);

  constructor(private readonly config: AppConfigService) {}

  isConfigured(): boolean {
    const c = this.config.plus100;
    return Boolean(c.baseUrl && c.agentId && c.authCode && c.secretKey);
  }

  async post<T = unknown>(method: string, body: object): Promise<T> {
    this.assertConfigured();
    const { baseUrl, agentId, authCode, secretKey } = this.config.plus100;
    const hash = generateHash(body, authCode, secretKey);
    const url = this.buildUrl(baseUrl, method, hash, agentId, secretKey);
    return this.requestJson<T>(url, body, method);
  }

  async addAccount(input: Plus100AddAccountInput): Promise<Plus100AddAccountResult> {
    assertPlus100Password(input.password);
    if (input.type === 'agent') {
      if (!input.account) {
        throw new BadRequestException('100Plus agent account is required');
      }
      assertPlus100AgentAccount(input.account);
    }
    const body: Record<string, string> = {
      type: input.type,
      password: input.password,
    };
    if (input.account) body.account = input.account;
    if (input.name) body.name = input.name;
    if (input.tel) body.tel = input.tel;
    if (input.desc) body.desc = input.desc;
    if (input.setScore) body.setScore = input.setScore;

    const json = await this.post<Plus100AddAccountResult>('addAccount', body);
    const account = json.account?.trim();
    if (!account) {
      throw new BadGatewayException({
        statusCode: HttpStatus.BAD_GATEWAY,
        code: 'PLUS100_BAD_GATEWAY',
        message: '100Plus addAccount did not return an account',
      });
    }
    return { status: json.status, account };
  }

  async editAccount(input: Plus100EditAccountInput): Promise<{ status: string }> {
    if (input.password) assertPlus100Password(input.password);
    const body: Record<string, string> = { account: input.account };
    if (input.password) body.password = input.password;
    if (input.name) body.name = input.name;
    if (input.tel) body.tel = input.tel;
    if (input.desc) body.desc = input.desc;
    return this.post('editAccount', body);
  }

  async getAccount(account: string): Promise<Plus100AccountDetails> {
    return this.post<Plus100AccountDetails>('getAccount', { account });
  }

  async disableAccount(account: string, disable: '0' | '1'): Promise<{ status: string }> {
    return this.post('disableAccount', { account, disable });
  }

  /** Positive = topup from agent, negative = withdraw from player. */
  async setScore(account: string, setScore: string): Promise<{ status: string }> {
    return this.post('setScore', { account, setScore });
  }

  /**
   * Player lobby launch (API 5.0 §1) — POST `{url}/launchGame`, not `/b/…`.
   * Password is MD5 hex of the plaintext player password.
   */
  async launchGame(
    account: string,
    password: string,
    locale?: string,
  ): Promise<Plus100LaunchResult> {
    this.assertConfigured();
    const body = {
      account,
      password: createHash('md5').update(password, 'utf8').digest('hex'),
      lang: plus100Lang(locale),
    };
    const url = `${this.config.plus100.baseUrl}/launchGame`;
    const json = await this.requestJson<Plus100LaunchResult>(url, body, 'launchGame');
    const clientUrl = json.clientUrl?.trim();
    if (!clientUrl) {
      throw new BadGatewayException({
        statusCode: HttpStatus.BAD_GATEWAY,
        code: 'PLUS100_BAD_GATEWAY',
        message: '100Plus launchGame did not return clientUrl',
      });
    }
    return { status: json.status, clientUrl };
  }

  private async requestJson<T>(url: string, body: object, methodLabel: string): Promise<T> {
    const payload = encodePhpUnescapedJson(body);
    this.logger.log(`100Plus request ${methodLabel} (secrets redacted)`);

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
        this.logger.error(`100Plus error ${methodLabel} non-JSON HTTP ${res.status}: ${snippet}`);
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
        this.logger.warn(`100Plus error ${methodLabel} code=${code} action=${action}`);
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
        '100Plus is not configured. Set PLUS100_API_URL, PLUS100_AGENT_ID, PLUS100_AUTH_CODE, PLUS100_SECRET_KEY.',
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
