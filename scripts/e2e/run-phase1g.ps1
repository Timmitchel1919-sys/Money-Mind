$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..")).Path
$originalLocation = Get-Location
$nodeCandidates = [System.Collections.Generic.List[string]]::new()
$pathNodeCommands = @(Get-Command node -CommandType Application -All -ErrorAction SilentlyContinue)
foreach ($command in $pathNodeCommands) {
  if (-not $command.Source) { continue }
  if (-not $nodeCandidates.Contains($command.Source)) { $nodeCandidates.Add($command.Source) }

  # If PATH's nvm symlink is an inactive shim, inspect only its matching
  # nvm-windows install root; do not run `nvm use` or change user settings.
  $nodeDirectory = Split-Path -Path $command.Source -Parent
  if ((Split-Path -Path $nodeDirectory -Leaf) -eq ".nodejs") {
    $nvmRoot = Split-Path -Path $nodeDirectory -Parent
    $installsRoot = Join-Path $nvmRoot "installs"
    if (Test-Path -LiteralPath $installsRoot) {
      foreach ($versionDirectory in (Get-ChildItem -LiteralPath $installsRoot -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending)) {
        $installedNode = Join-Path $versionDirectory.FullName "node.exe"
        if ((Test-Path -LiteralPath $installedNode) -and -not $nodeCandidates.Contains($installedNode)) { $nodeCandidates.Add($installedNode) }
      }
    }
  }
}

# Also use conventional nvm environment roots when the PATH entry is a shim
# without an adjacent installs directory.
foreach ($managerRoot in @($env:NVM_HOME, $env:NVM_DIR) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }) {
  $installsRoot = Join-Path $managerRoot "installs"
  if (Test-Path -LiteralPath $installsRoot) {
    foreach ($versionDirectory in (Get-ChildItem -LiteralPath $installsRoot -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending)) {
      $installedNode = Join-Path $versionDirectory.FullName "node.exe"
      if ((Test-Path -LiteralPath $installedNode) -and -not $nodeCandidates.Contains($installedNode)) { $nodeCandidates.Add($installedNode) }
    }
  }
}

$nodeExe = $null
$nodeVersion = $null
foreach ($candidate in $nodeCandidates) {
  if (-not (Test-Path -LiteralPath $candidate)) { continue }
  $candidateOutput = @(& $candidate --version 2>$null)
  $candidateExitCode = $LASTEXITCODE
  $candidateVersion = $candidateOutput | Where-Object { $_ -match '^v\d+\.\d+\.\d+' } | Select-Object -First 1
  if ($candidateExitCode -eq 0 -and $candidateVersion) {
    $nodeExe = $candidate
    $nodeVersion = $candidateVersion.Trim()
    break
  }
}
if (-not $nodeExe) { throw "No runnable Node executable was found on PATH or in the detected nvm install roots." }

$playwrightResolve = & $nodeExe --input-type=module -e "console.log(import.meta.resolve('playwright-core'))" 2>$null
if ($LASTEXITCODE -ne 0) { throw "playwright-core cannot be resolved by $nodeExe from $repoRoot" }
$playwrightPackage = [System.Uri]::UnescapeDataString(([System.Uri]$playwrightResolve.Trim()).LocalPath)
$viteResolve = & $nodeExe --input-type=module -e "console.log(import.meta.resolve('vite'))" 2>$null
if ($LASTEXITCODE -ne 0) { throw "Vite cannot be resolved by $nodeExe from $repoRoot" }
$viteEntry = [System.Uri]::UnescapeDataString(([System.Uri]$viteResolve.Trim()).LocalPath)
if (-not (Test-Path -LiteralPath $playwrightPackage)) { throw "Resolved Playwright package is missing: $playwrightPackage" }
if (-not (Test-Path -LiteralPath $viteEntry)) { throw "Resolved Vite entry is missing: $viteEntry" }

$chromeCandidates = @(
  $env:PHASE1H_BROWSER_PATH,
  $env:PHASE1G_CHROME_PATH,
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
$browserPath = $null
foreach ($candidate in $chromeCandidates) {
  $browserVersion = (Get-Item -LiteralPath $candidate).VersionInfo.FileVersion
  if ($browserVersion) { $browserPath = $candidate; break }
}
if (-not $browserPath) { throw "Chrome or Edge was not found or could not run. Set PHASE1H_BROWSER_PATH to an installed Chromium executable." }

$runRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("money-mind-phase1g-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $runRoot | Out-Null

$previousTemp = $env:TEMP
$previousTmp = $env:TMP
$previousChrome = $env:PHASE1G_CHROME_PATH
$previousBrowser = $env:PHASE1H_BROWSER_PATH
$env:TEMP = $runRoot
$env:TMP = $runRoot
$env:PHASE1G_CHROME_PATH = $browserPath
$env:PHASE1H_BROWSER_PATH = $browserPath

try {
  Set-Location -LiteralPath $repoRoot
  Write-Host "Phase 1G/1H Windows host runner"
  Write-Host "Node: $nodeExe ($nodeVersion)"
  Write-Host "Playwright resolved to: $playwrightPackage"
  Write-Host "Vite resolved to: $viteEntry"
  Write-Host "Browser: $browserPath ($browserVersion)"
  $nodeScript = Join-Path $PSScriptRoot "phase1g-emulator-acceptance.mjs"
  $nodeStartInfo = New-Object System.Diagnostics.ProcessStartInfo
  $nodeStartInfo.FileName = $nodeExe
  $nodeStartInfo.Arguments = '"' + $nodeScript + '"'
  $nodeStartInfo.WorkingDirectory = $repoRoot
  $nodeStartInfo.UseShellExecute = $false
  $nodeStartInfo.CreateNoWindow = $true
  $nodeStartInfo.RedirectStandardOutput = $true
  $nodeStartInfo.RedirectStandardError = $true
  $nodeProcess = New-Object System.Diagnostics.Process
  $nodeProcess.StartInfo = $nodeStartInfo
  if (-not $nodeProcess.Start()) { throw "Could not start Node: $nodeExe" }
  $nodeStdoutTask = $nodeProcess.StandardOutput.ReadToEndAsync()
  $nodeStderrTask = $nodeProcess.StandardError.ReadToEndAsync()
  $nodeProcess.WaitForExit()
  $nodeStdout = $nodeStdoutTask.GetAwaiter().GetResult()
  $nodeStderr = $nodeStderrTask.GetAwaiter().GetResult()
  if ($nodeStdout) { Write-Host $nodeStdout.TrimEnd() }
  if ($nodeStderr) { Write-Host $nodeStderr.TrimEnd() }
  if ($nodeProcess.ExitCode -ne 0) { throw "Phase 1G/1H E2E failed with exit code $($nodeProcess.ExitCode)" }
}
finally {
  $env:TEMP = $previousTemp
  $env:TMP = $previousTmp
  $env:PHASE1G_CHROME_PATH = $previousChrome
  $env:PHASE1H_BROWSER_PATH = $previousBrowser
  if (Test-Path -LiteralPath $runRoot) { Remove-Item -LiteralPath $runRoot -Recurse -Force }
  Set-Location -LiteralPath $originalLocation.Path
}
