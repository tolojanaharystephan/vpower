import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database';
import { providerPlayerAccounts, users } from '../../database/schema';
import {
  decryptVblinkPassword,
  encryptVblinkPassword,
} from '../../common/crypto/vblink-password';
import type { LaunchSessionResult } from '../game-integration/game-provider.interface';
import { Plus100ApiClient } from './plus100-api-client.service';
import { randomPlus100Password } from './plus100-password';

export const PLUS100_PROVIDER_SLUG = '100plus';

@Injectable()
export class Provider100PlusService {
  private readonly logger = new Logger(Provider100PlusService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly api: Plus100ApiClient,
  ) {}

  isConfigured(): boolean {
    return this.api.isConfigured();
  }

  /**
   * Create a 100plus player on first launch (they assign the 11-digit account).
   * Password is stored encrypted in provider_player_accounts.
   */
  async ensurePlayer(userId: string): Promise<{ account: string; password: string }> {
    const [existing] = await this.db
      .select()
      .from(providerPlayerAccounts)
      .where(
        and(
          eq(providerPlayerAccounts.userId, userId),
          eq(providerPlayerAccounts.providerSlug, PLUS100_PROVIDER_SLUG),
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

    const password = randomPlus100Password();
    const name = playerName(user.email, user.firstName, user.lastName);
    const created = await this.api.addAccount({
      type: 'player',
      password,
      name,
      desc: `vpower:${userId.slice(0, 8)}`,
    });

    await this.db.insert(providerPlayerAccounts).values({
      userId,
      providerSlug: PLUS100_PROVIDER_SLUG,
      externalAccount: created.account,
      fullAccount: created.account,
      externalPassword: encryptVblinkPassword(password),
    });

    this.logger.log(`100Plus player created for user ${userId}`);
    return { account: created.account, password };
  }

  async launchLobby(userId: string, locale?: string): Promise<LaunchSessionResult> {
    const { account, password } = await this.ensurePlayer(userId);
    const launched = await this.api.launchGame(account, password, locale);

    return {
      mode: 'client',
      gameId: '100plus-lobby',
      slug: PLUS100_PROVIDER_SLUG,
      title: '100plus',
      sessionId: randomUUID(),
      launchUrl: launched.clientUrl,
      message: '100Plus lobby is ready.',
      plus100Account: account,
      plus100Password: password,
      requiresManualLogin: false,
    };
  }
}

function playerName(
  email: string,
  firstName: string | null,
  lastName: string | null,
): string {
  const raw = `${firstName || ''}${lastName || ''}` || email.split('@')[0] || 'player';
  const compact = raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  return compact || 'player';
}
