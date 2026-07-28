import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// pnpm --filter runs with cwd = apps/api
const apiRoot = process.cwd();
const repoRoot = resolve(apiRoot, '../..');
const envCandidates = [resolve(repoRoot, '.env'), resolve(apiRoot, '.env')];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    loadEnv({ path: envPath });
    console.log(`[db] loaded env: ${envPath}`);
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      `DATABASE_URL is required. Looked for .env in:\n- ${envCandidates.join('\n- ')}`,
    );
  }

  const migrationsFolder = resolve(apiRoot, 'drizzle');
  if (!existsSync(migrationsFolder)) {
    throw new Error(`Migrations folder not found: ${migrationsFolder}`);
  }

  const client = postgres(url, {
    max: 1,
    onnotice: () => undefined,
  });
  const db = drizzle(client);

  try {
    console.log('[db] applying migrations…');
    await migrate(db, { migrationsFolder });
    console.log('[db] migrations applied successfully');
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error('[db] migration failed');
  console.error(error);
  process.exit(1);
});
