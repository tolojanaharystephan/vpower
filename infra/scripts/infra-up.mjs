#!/usr/bin/env node
/**
 * Smart infra bootstrap:
 * - Prefer Docker Compose when `docker` is available
 * - Otherwise fall back to native Windows Postgres/Redis check
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function hasDocker() {
  const result = spawnSync('docker', ['compose', 'version'], {
    encoding: 'utf8',
    shell: true,
  });
  return result.status === 0;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    ...options,
  });
  process.exit(result.status ?? 1);
}

if (hasDocker()) {
  console.log('[infra] Docker detected → docker compose up -d');
  run('docker', ['compose', 'up', '-d']);
} else {
  console.log('[infra] Docker not found → native local mode');
  console.log('[infra] Tip: install Docker Desktop later, or keep using native Postgres/Redis.\n');
  const script = join(root, 'infra/scripts/infra-up-native.ps1');
  if (!existsSync(script)) {
    console.error('[infra] Missing native script:', script);
    process.exit(1);
  }
  run('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script]);
}
