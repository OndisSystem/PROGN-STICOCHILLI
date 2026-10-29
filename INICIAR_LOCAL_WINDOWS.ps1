$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host 'Instale o Node.js 22.16 ou superior antes de iniciar.' -ForegroundColor Red
  Read-Host 'Pressione ENTER'
  exit 1
}
$env:NODE_ENV='development'
$env:SECURE_COOKIES='0'
$env:PORT='3000'
$env:HOST='127.0.0.1'
$env:DB_PATH=(Join-Path $PSScriptRoot 'data\prognostico.sqlite')
$env:MASTER_USERNAME='SuperChilli2026'
$env:SEED_AUGUST_EXAMPLE='1'
if (-not $env:MASTER_PASSWORD -and -not (Test-Path $env:DB_PATH)) {
  $secure = Read-Host 'Digite a senha inicial Master (somente para o primeiro acesso)' -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {$env:MASTER_PASSWORD=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)}
  finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
}
Write-Host 'Prognóstico V19.3: http://localhost:3000 (login Master ou e-mail da conta).' -ForegroundColor Green
Write-Host 'A conta Master é configurada no primeiro acesso e mantida no banco.' -ForegroundColor Gray
node server.js
