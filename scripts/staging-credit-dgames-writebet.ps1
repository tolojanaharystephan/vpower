# Credit demo dgames wallet on staging + exercise writeBet callback (no real payment).
# Reads SECRETS_LOCAL.md the same way as deploy-staging-dgames.ps1 — do not print secrets.
Import-Module Posh-SSH

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$secretsPath = Join-Path $root 'SECRETS_LOCAL.md'
$secrets = Get-Content $secretsPath -Raw

function Get-Secret([string]$name) {
  if ($secrets -match "(?m)^$([regex]::Escape($name))=(.*)$") {
    return $Matches[1].Trim()
  }
  throw "Missing $name in SECRETS_LOCAL.md"
}

$hostName = Get-Secret 'VPS_HOST'
$user = Get-Secret 'VPS_USER'
$pass = Get-Secret 'VPS_PASSWORD'
$hallId = Get-Secret 'DGAMES_HALL_ID'
$hallKey = Get-Secret 'DGAMES_HALL_KEY'
$login = 'vpe88774bb77a4'
$userId = 'e88774bb-77a4-4dd5-af18-a773f959f3ef'
$creditCents = 10000

$secure = ConvertTo-SecureString $pass -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential($user, $secure)
Write-Host "==> SSH $user@$hostName (credit dgames wallet)"
$session = New-SSHSession -ComputerName $hostName -Credential $cred -AcceptKey -ConnectionTimeout 30
if (-not $session) { throw 'SSH session failed' }
$sid = $session.SessionId

# LF-only remote bash (CRLF from Windows heredocs breaks `set -o pipefail`).
$sql = @"
UPDATE user_wallets SET balance_cents = balance_cents + $creditCents, updated_at = NOW() WHERE user_id = '$userId' AND room_slug = 'dgames';
INSERT INTO user_wallets (id, user_id, room_slug, balance_cents, updated_at) SELECT gen_random_uuid(), '$userId', 'dgames', $creditCents, NOW() WHERE NOT EXISTS (SELECT 1 FROM user_wallets WHERE user_id = '$userId' AND room_slug = 'dgames');
SELECT room_slug, balance_cents FROM user_wallets WHERE user_id = '$userId' AND room_slug = 'dgames';
"@ -replace "`r`n", "`n" -replace "`r", "`n"

$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($sql))
$remote = "echo $b64 | base64 -d | docker exec -i vpower777-postgres psql -U vpower777 -d vpower777 -v ON_ERROR_STOP=1"
$r = Invoke-SSHCommand -SessionId $sid -Command $remote -TimeOut 60
Write-Host $r.Output
if ($r.ExitStatus -ne 0) {
  Write-Host $r.Error
  Remove-SSHSession -SessionId $sid | Out-Null
  throw "credit failed exit=$($r.ExitStatus)"
}
Remove-SSHSession -SessionId $sid | Out-Null

$tradeId = "test-wb-$(Get-Date -Format 'yyyyMMddHHmmss')"
$body = @{
  cmd = 'writeBet'
  hall = $hallId
  key = $hallKey
  login = $login
  bet = '1.00'
  win = '0.00'
  tradeId = $tradeId
  sessionId = 'softlaunch-test'
  gameId = '1'
} | ConvertTo-Json

Write-Host "==> writeBet tradeId=$tradeId (bet 1.00)"
$wb = Invoke-RestMethod -Uri 'https://staging.vpower777.online/api/v1/providers/dgames/callback' -Method POST -Body $body -ContentType 'application/json'
Write-Host ($wb | ConvertTo-Json -Compress)

Write-Host '==> getBalance'
$gbBody = @{ cmd = 'getBalance'; hall = $hallId; key = $hallKey; login = $login } | ConvertTo-Json
$gb = Invoke-RestMethod -Uri 'https://staging.vpower777.online/api/v1/providers/dgames/callback' -Method POST -Body $gbBody -ContentType 'application/json'
Write-Host ($gb | ConvertTo-Json -Compress)
Write-Host 'DONE'
