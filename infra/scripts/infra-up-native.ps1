# Native local infra (Windows) — no Docker required.
# Starts Redis if installed; checks PostgreSQL connectivity.

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Write-Host "==> VPower777 native infra check" -ForegroundColor Cyan

$psql = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
if (-not (Test-Path $psql)) {
  $psqlCmd = Get-Command psql -ErrorAction SilentlyContinue
  if ($psqlCmd) { $psql = $psqlCmd.Source }
}

if (-not (Test-Path $psql)) {
  Write-Host "PostgreSQL client (psql) not found. Install PostgreSQL or Docker Desktop." -ForegroundColor Red
  exit 1
}

$envFile = Join-Path $Root ".env"
if (-not (Test-Path $envFile)) {
  Write-Host ".env missing - copy .env.example to .env first." -ForegroundColor Red
  exit 1
}

$dbUrlLine = Get-Content $envFile | Where-Object { $_ -match "^DATABASE_URL=" } | Select-Object -First 1
if (-not $dbUrlLine) {
  Write-Host "DATABASE_URL missing in .env" -ForegroundColor Red
  exit 1
}
$dbUrl = $dbUrlLine.Substring("DATABASE_URL=".Length)

if ($dbUrl -notmatch "^postgres(?:ql)?://([^:]+):([^@]+)@([^:/]+):?(\d+)?/(.+)$") {
  Write-Host "Could not parse DATABASE_URL" -ForegroundColor Red
  exit 1
}

$dbUser = $Matches[1]
$dbPass = $Matches[2]
$dbHost = $Matches[3]
$dbPort = "5432"
if ($Matches[4]) { $dbPort = $Matches[4] }
$dbName = $Matches[5]

$env:PGPASSWORD = $dbPass
& $psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -c "SELECT 1 AS postgres_ok;" | Out-Host
if ($LASTEXITCODE -ne 0) {
  Write-Host "PostgreSQL connection failed for user=$dbUser host=$dbHost port=$dbPort db=$dbName" -ForegroundColor Red
  exit 1
}
Write-Host "PostgreSQL: OK host=$dbHost port=$dbPort db=$dbName" -ForegroundColor Green

$redisCli = "C:\Program Files\Redis\redis-cli.exe"
$redisServer = "C:\Program Files\Redis\redis-server.exe"
$redisUp = $false

if (Test-Path $redisCli) {
  $pong = & $redisCli ping 2>$null
  if ($pong -eq "PONG") { $redisUp = $true }
}

if (-not $redisUp) {
  if (Test-Path $redisServer) {
    Write-Host "Starting Redis..." -ForegroundColor Yellow
    Start-Process -FilePath $redisServer -WindowStyle Hidden
    Start-Sleep -Seconds 2
    $pong = & $redisCli ping 2>$null
    if ($pong -eq "PONG") { $redisUp = $true }
  }
}

if ($redisUp) {
  Write-Host "Redis: OK on port 6379" -ForegroundColor Green
} else {
  Write-Host "Redis: NOT RUNNING - install Redis or start redis-server" -ForegroundColor Yellow
  Write-Host "  winget install Redis.Redis" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "Native infra ready. Next:" -ForegroundColor Cyan
Write-Host "  pnpm db:migrate"
Write-Host "  pnpm --filter @vpower777/api dev"
Write-Host ""
Write-Host "Note: use pnpm infra:up:docker when Docker Desktop is installed." -ForegroundColor DarkGray
