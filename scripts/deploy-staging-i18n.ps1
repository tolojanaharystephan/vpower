# Pull + rebuild staging after locale fix (SSH only; no .env changes).
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

$secure = ConvertTo-SecureString $pass -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential($user, $secure)

Write-Host "==> SSH $user@$hostName"
$session = New-SSHSession -ComputerName $hostName -Credential $cred -AcceptKey -ConnectionTimeout 30
if (-not $session) { throw 'SSH session failed' }
$sid = $session.SessionId

$bash = @"
set -euo pipefail
cd '$appPath'
echo '==> git pull'
git stash push -u -m "pre-i18n-fix-$(date -u +%Y%m%d%H%M%S)" || true
git pull --ff-only
echo "==> HEAD `$(git rev-parse --short HEAD)"
echo '==> deploy'
bash deploy.sh
echo '==> health'
curl -fsS https://127.0.0.1/health -H 'Host: staging.vpower777.online' 2>/dev/null || curl -fsS http://127.0.0.1/health || curl -fsS https://staging.vpower777.online/health || true
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
if ($result.ExitStatus -ne 0) { exit $result.ExitStatus }
