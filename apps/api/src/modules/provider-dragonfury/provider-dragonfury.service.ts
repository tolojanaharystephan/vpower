import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import { providerPlayerAccounts, users } from '../../database/schema';
import {
  decryptVblinkPassword,
  encryptVblinkPassword,
} from '../../common/crypto/vblink-password';
import type { LaunchSessionResult } from '../game-integration/game-provider.interface';
import { VblinkApiException } from '../game-integration/vblink/vblink-errors';
import { AppConfigService } from '../../config/app-config.service';
import { DragonfuryClientService } from './dragonfury-client.service';

export const DRAGONFURY_PROVIDER_SLUG = 'dragonfury';

@Injectable()
export class ProviderDragonfuryService {
  private readonly logger = new Logger(ProviderDragonfuryService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly api: DragonfuryClientService,
    private readonly config: AppConfigService,
  ) {}

  isConfigured(): boolean {
    return this.api.isConfigured();
  }

  async ensurePlayer(userId: string): Promise<{ account: string; password: string }> {
    this.api.assertConfigured();

    const [existing] = await this.db
      .select()
      .from(providerPlayerAccounts)
      .where(
        and(
          eq(providerPlayerAccounts.userId, userId),
          eq(providerPlayerAccounts.providerSlug, DRAGONFURY_PROVIDER_SLUG),
        ),
      )
      .limit(1);

    if (existing) {
      return {
        account: existing.fullAccount || existing.externalAccount,
        password: decryptVblinkPassword(existing.externalPassword),
      };
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);
    if (!user) throw new NotFoundException('User not found');

    const account = randomDragonfuryAccount(userId);
    const password = randomDragonfuryPassword();
    let storedAccount = account;

    try {
      const created = await this.api.createPlayer(account, password);
      storedAccount = created.fullAccount || account;
      if (created.alreadyExists) {
        this.logger.warn(`Dragon Fury account already exists for user ${userId} (code 12)`);
        await this.api.resetPassword(account, password);
      }
    } catch (err) {
      if (err instanceof VblinkApiException && err.vblinkCode === 12) {
        this.logger.warn(`Dragon Fury account already exists for user ${userId} (code 12)`);
        await this.api.resetPassword(account, password);
      } else {
        throw err;
      }
    }

    await this.db.insert(providerPlayerAccounts).values({
      userId,
      providerSlug: DRAGONFURY_PROVIDER_SLUG,
      externalAccount: account,
      fullAccount: storedAccount,
      externalPassword: encryptVblinkPassword(password),
    });

    this.logger.log(`Dragon Fury player created for user ${userId}`);
    return { account: storedAccount, password };
  }

  async launchLobby(userId: string): Promise<LaunchSessionResult> {
    const { account, password } = await this.ensurePlayer(userId);
    const lobbyUrl = this.config.dragonfury.lobbyUrl;

    return {
      mode: 'client',
      gameId: 'dragonfury-lobby',
      slug: DRAGONFURY_PROVIDER_SLUG,
      title: 'Dragon Fury',
      sessionId: randomUUID(),
      launchUrl: lobbyUrl,
      message:
        'Dragon Fury player account is ready. Open the lobby, sign in with your credentials, and play.',
      dragonfuryAccount: account,
      dragonfuryPassword: password,
      requiresManualLogin: true,
    };
  }
}

const LETTERS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const ALL_PASS = LETTERS + DIGITS;

function randomDragonfuryAccount(userId: string): string {
  const compact = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  const suffix = randomBytes(2).toString('hex');
  return `df${compact}${suffix}`.slice(0, 16);
}

function randomDragonfuryPassword(): string {
  const bytes = randomBytes(16);
  const pick = (alphabet: string, byte: number) => alphabet[byte % alphabet.length] ?? alphabet[0]!;
  const chars: string[] = [pick(LETTERS, bytes[0] ?? 0), pick(DIGITS, bytes[1] ?? 0)];
  for (let i = 2; i < 16; i++) {
    chars.push(pick(ALL_PASS, bytes[i] ?? 0));
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = (bytes[i] ?? 0) % (i + 1);
    const a = chars[i] ?? 'a';
    const b = chars[j] ?? 'a';
    chars[i] = b;
    chars[j] = a;
  }
  return chars.join('');
}
