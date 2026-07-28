import { Global, Module, OnModuleDestroy, Inject } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { createDatabase, type Database } from './database';
import { DRIZZLE } from './database.constants';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): Database => {
        return createDatabase(config.databaseUrl);
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async onModuleDestroy() {
    // postgres.js client is stored on the drizzle instance internals via session
    const client = (this.db as unknown as { $client?: { end?: (opts?: { timeout?: number }) => Promise<void> } })
      .$client;
    if (client?.end) {
      await client.end({ timeout: 5 });
    }
  }
}
