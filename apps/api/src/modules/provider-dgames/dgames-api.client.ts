import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';

export type DgamesListGame = {
  id: string;
  name: string;
  img?: string;
  device?: string;
  title?: string;
  categories?: string;
  demo?: string;
  exitButton?: string;
  rewriterule?: string;
  provider: string;
};

type GamesApiEnvelope = {
  status?: string;
  error?: string;
  content?: unknown;
};

@Injectable()
export class DgamesApiClient {
  private readonly logger = new Logger(DgamesApiClient.name);

  constructor(private readonly config: AppConfigService) {}

  isConfigured(): boolean {
    const c = this.config.dgames;
    return Boolean(c.enabled && c.apiBaseUrl && c.hallId && c.hallKey);
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'DGames is not configured. Set DGAMES_ENABLED, DGAMES_API_BASE_URL, DGAMES_HALL_ID, DGAMES_HALL_KEY.',
      );
    }
  }

  async getGamesList(img = 'game_img_2'): Promise<DgamesListGame[]> {
    this.assertConfigured();
    const c = this.config.dgames;
    const data = await this.postJson<GamesApiEnvelope>(`${c.apiBaseUrl}/`, {
      cmd: 'getGamesList',
      hall: c.hallId,
      key: c.hallKey,
      img,
    });
    if (data.status !== 'success') {
      throw new ServiceUnavailableException(data.error || 'DGames getGamesList failed');
    }
    return flattenGamesList(data.content);
  }

  async openGame(input: {
    login: string;
    gameId: string;
    language?: string;
    demo?: '0' | '1';
  }): Promise<{
    url: string;
    sessionId?: string;
    iframe?: string;
    withoutFrame?: string;
    exitButton?: string;
    exitButtonMobile?: string;
    width?: string;
  }> {
    this.assertConfigured();
    const c = this.config.dgames;
    const data = await this.postJson<GamesApiEnvelope>(`${c.apiBaseUrl}/openGame/`, {
      cmd: 'openGame',
      hall: c.hallId,
      key: c.hallKey,
      domain: c.domain,
      exitUrl: c.exitUrl,
      language: input.language || 'en',
      login: input.login,
      gameId: String(input.gameId),
      demo: input.demo ?? '0',
    });
    if (data.status !== 'success') {
      throw new ServiceUnavailableException(data.error || 'DGames openGame failed');
    }
    const content = data.content as {
      game?: Record<string, unknown>;
      gameRes?: { sessionId?: string | number };
    };
    const game = content?.game ?? {};
    const url = String(game.url ?? '');
    if (!url) {
      throw new ServiceUnavailableException('DGames openGame returned no URL');
    }
    return {
      url,
      sessionId: content?.gameRes?.sessionId != null ? String(content.gameRes.sessionId) : undefined,
      iframe: game.iframe != null ? String(game.iframe) : undefined,
      withoutFrame: game.withoutFrame != null ? String(game.withoutFrame) : undefined,
      exitButton: game.exitButton != null ? String(game.exitButton) : undefined,
      exitButtonMobile:
        game.exitButton_mobile != null ? String(game.exitButton_mobile) : undefined,
      width: game.width != null ? String(game.width) : undefined,
    };
  }

  private async postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const timeoutMs = this.config.dgames.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const text = await res.text();
      if (!res.ok) {
        this.logger.warn(`DGames HTTP ${res.status}: ${text.slice(0, 300)}`);
        throw new ServiceUnavailableException(`DGames HTTP ${res.status}`);
      }
      try {
        return JSON.parse(text) as T;
      } catch {
        this.logger.warn(`DGames non-JSON response: ${text.slice(0, 300)}`);
        throw new ServiceUnavailableException('DGames returned non-JSON');
      }
    } finally {
      clearTimeout(timer);
    }
  }
}

function flattenGamesList(content: unknown): DgamesListGame[] {
  if (!content || typeof content !== 'object') return [];
  const out: DgamesListGame[] = [];
  for (const [provider, games] of Object.entries(content as Record<string, unknown>)) {
    if (!Array.isArray(games)) continue;
    for (const raw of games) {
      if (!raw || typeof raw !== 'object') continue;
      const g = raw as Record<string, unknown>;
      const id = g.id != null ? String(g.id) : '';
      if (!id) continue;
      out.push({
        id,
        name: String(g.name ?? id),
        img: g.img != null ? String(g.img) : undefined,
        device: g.device != null ? String(g.device) : undefined,
        title: g.title != null ? String(g.title) : provider,
        categories: g.categories != null ? String(g.categories) : undefined,
        demo: g.demo != null ? String(g.demo) : undefined,
        exitButton: g.exitButton != null ? String(g.exitButton) : undefined,
        rewriterule: g.rewriterule != null ? String(g.rewriterule) : undefined,
        provider,
      });
    }
  }
  return out;
}
