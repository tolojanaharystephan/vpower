# Deploy DGames config to staging VPS (reads SECRETS_LOCAL.md — do not commit this script's runtime secrets).
Import-Module Posh-SSH

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
$appPath = Get-Secret 'VPS_APP_PATH'
$hallId = Get-Secret 'DGAMES_HALL_ID'
$hallKey = Get-Secret 'DGAMES_HALL_KEY'
$apiBase = Get-Secret 'DGAMES_API_BASE_URL'

$secure = ConvertTo-SecureString $pass -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential($user, $secure)

Write-Host "==> SSH $user@$hostName"
$session = New-SSHSession -ComputerName $hostName -Credential $cred -AcceptKey -ConnectionTimeout 30
if (-not $session) { throw 'SSH session failed' }
$sid = $session.SessionId

# Build remote bash with base64 payload to avoid shell-quoting hell (hall key has $).
$bash = @"
set -euo pipefail
cd '$appPath'
echo '==> git pull'
git stash push -u -m "pre-dgames-deploy-$(date -u +%Y%m%d%H%M%S)" || true
git pull --ff-only
python3 - <<'PY'
from pathlib import Path
p = Path('.env')
text = p.read_text() if p.exists() else ''
vals = {
  'DGAMES_ENABLED': 'true',
  'DGAMES_API_BASE_URL': $(ConvertTo-Json $apiBase),
  'DGAMES_HALL_ID': $(ConvertTo-Json $hallId),
  'DGAMES_HALL_KEY': $(ConvertTo-Json $hallKey),
  'DGAMES_CURRENCY': 'USD',
  'DGAMES_TIMEOUT_MS': '15000',
  'APP_URL': 'https://staging.vpower777.online',
  'ADMIN_URL': 'https://staging.vpower777.online',
  'API_URL': 'https://staging.vpower777.online',
  'NEXT_PUBLIC_API_URL': 'https://staging.vpower777.online',
}
lines = text.splitlines()
keys = set()
out = []
for line in lines:
    if '=' in line and not line.strip().startswith('#'):
        k = line.split('=', 1)[0]
        if k in vals:
            out.append(f'{k}={vals[k]}')
            keys.add(k)
            continue
    out.append(line)
for k, v in vals.items():
    if k not in keys:
        out.append(f'{k}={v}')
p.write_text('\n'.join(out).rstrip() + '\n')
print('env upserted', ','.join(vals))
PY
echo '==> env keys:'
grep -E '^(DGAMES_|APP_URL|API_URL)=' .env | sed 's/=.*/=***/'
echo "==> HEAD \$(git rev-parse --short HEAD)"
echo '==> deploy'
bash deploy.sh
echo '==> health'
curl -fsS https://127.0.0.1/health -H 'Host: staging.vpower777.online' 2>/dev/null || curl -fsS http://127.0.0.1/health || curl -fsS https://staging.vpower777.online/health || true
echo
echo '==> dgames callback'
curl -sS -X POST https://staging.vpower777.online/api/v1/providers/dgames/callback -H 'Content-Type: application/json' -d '{"cmd":"getBalance"}' || true
echo
echo DONE
"@

Write-Host '==> remote deploy (docker build can take several minutes)...'
$bashLf = ($bash -replace "`r`n", "`n") -replace "`r", "`n"
$result = Invoke-SSHCommand -SessionId $sid -Command $bashLf -TimeOut 1800
Write-Host $result.Output
if ($result.Error) { Write-Host 'STDERR:'; Write-Host $result.Error }
Write-Host "exit=$($result.ExitStatus)"
Remove-SSHSession -SessionId $sid | Out-Null
exit $result.ExitStatus
