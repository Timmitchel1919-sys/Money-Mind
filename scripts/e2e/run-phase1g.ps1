$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..")).Path
$nodeCommand = @(Get-Command node -CommandType Application -All -ErrorAction Stop)[0]
$nodeExe = $nodeCommand.Source
$nodeVersion = (& $nodeExe --version).Trim()
if ($LASTEXITCODE -ne 0) { throw "The active Node executable failed: $nodeExe" }

$playwrightPackage = Join-Path $repoRoot "node_modules\playwright-core\package.json"
$viteBin = Join-Path $repoRoot "node_modules\vite\bin\vite.js"
if (-not (Test-Path -LiteralPath $playwrightPackage)) { throw "playwright-core is not installed at $playwrightPackage" }
if (-not (Test-Path -LiteralPath $viteBin)) { throw "Vite is not installed at $viteBin" }

$chromeCandidates = @(
  $env:PHASE1G_CHROME_PATH,
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
if (-not $chromeCandidates) { throw "Chrome or Edge was not found. Set PHASE1G_CHROME_PATH to an installed Chromium executable." }

$runRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("money-mind-phase1g-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $runRoot | Out-Null

$previousTemp = $env:TEMP
$previousTmp = $env:TMP
$previousChrome = $env:PHASE1G_CHROME_PATH
$env:TEMP = $runRoot
$env:TMP = $runRoot
$env:PHASE1G_CHROME_PATH = $chromeCandidates[0]

try {
  Write-Host "Phase 1G host runner"
  Write-Host "Node: $nodeExe ($nodeVersion)"
  Write-Host "Playwright: $playwrightPackage"
  Write-Host "Browser: $env:PHASE1G_CHROME_PATH"
  & $nodeExe (Join-Path $PSScriptRoot "phase1g-emulator-acceptance.mjs")
  if ($LASTEXITCODE -ne 0) { throw "Phase 1G E2E failed with exit code $LASTEXITCODE" }
}
finally {
  $env:TEMP = $previousTemp
  $env:TMP = $previousTmp
  $env:PHASE1G_CHROME_PATH = $previousChrome
  if (Test-Path -LiteralPath $runRoot) { Remove-Item -LiteralPath $runRoot -Recurse -Force }
}
