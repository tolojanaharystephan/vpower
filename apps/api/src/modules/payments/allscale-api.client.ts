import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { signAllscaleRequest } from './allscale-signing';

type AllscaleEnvelope<T> = {
  code: number;
  payload: T | null;
  error: { message?: string; details?: unknown } | null;
  request_id?: string;
};

export type CreateCheckoutIntentResult = {
  checkoutUrl: string;
  checkoutIntentId: string;
  amountCoins: string;
  requestId?: string;
};

@Injectable()
export class AllscaleApiClient {
  private readonly logger = new Logger(AllscaleApiClient.name);

  constructor(private readonly config: AppConfigService) {}

  isConfigured(): boolean {
    const c = this.config.allscale;
    return Boolean(c.apiKey && c.apiSecret && c.baseUrl);
  }

  async ping(): Promise<boolean> {
    await this.request('GET', '/v1/test/ping');
    return true;
  }

  async createCheckoutIntent(input: {
    amountCents: number;
    orderId: string;
    userId: string;
    userName?: string;
    redirectUrl: string;
    roomSlug: string;
  }): Promise<CreateCheckoutIntentResult> {
    const body = {
      currency: this.config.allscale.currencyUsd,
      amount_cents: input.amountCents,
      order_id: input.orderId,
      order_description: `VPower777 deposit (${input.roomSlug})`,
      user_id: input.userId,
      user_name: input.userName || undefined,
      redirect_url: input.redirectUrl,
      extra: { roomSlug: input.roomSlug, source: 'vpower777' },
    };

    const payload = await this.request<{
      checkout_url: string;
      allscale_checkout_intent_id: string;
      amount_coins?: string;
    }>('POST', '/v1/checkout_intents/', body);

    if (!payload?.checkout_url || !payload.allscale_checkout_intent_id) {
      throw new ServiceUnavailableException('AllScale checkout intent incomplete');
    }

    return {
      checkoutUrl: payload.checkout_url,
      checkoutIntentId: payload.allscale_checkout_intent_id,
      amountCoins: payload.amount_coins ?? '',
    };
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    jsonBody?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'AllScale is not configured. Set ALLSCALE_API_KEY and ALLSCALE_API_SECRET.',
      );
    }

    const { apiKey, apiSecret, baseUrl } = this.config.allscale;
    const body = jsonBody ? JSON.stringify(jsonBody) : '';
    const signed = signAllscaleRequest({
      apiSecret,
      method,
      path,
      query: '',
      body,
    });

    const url = `${baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-Timestamp': signed.timestamp,
        'X-Nonce': signed.nonce,
        'X-Signature': signed.signatureHeader,
      },
      body: method === 'GET' ? undefined : body,
    });

    const text = await res.text();
    let parsed: AllscaleEnvelope<T> | null = null;
    try {
      parsed = JSON.parse(text) as AllscaleEnvelope<T>;
    } catch {
      this.logger.warn(`AllScale non-JSON response ${res.status}: ${text.slice(0, 200)}`);
      throw new ServiceUnavailableException('AllScale returned invalid response');
    }

    if (!res.ok || parsed.code !== 0 || !parsed.payload) {
      const msg = parsed.error?.message || `AllScale error code ${parsed.code}`;
      this.logger.warn(`AllScale ${method} ${path} failed: ${msg} (request_id=${parsed.request_id})`);
      throw new ServiceUnavailableException(msg);
    }

    return parsed.payload;
  }
}
