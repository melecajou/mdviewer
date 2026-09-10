# MDViewer PowerShell Launcher Script
$ScriptDir = Split-Path -Parent $PSScriptRoot
$ElectronBin = Join-Path $ScriptDir "node_modules\electron\dist\electron.exe"

if (Test-Path $ElectronBin) {
    & $ElectronBin $ScriptDir @args
} else {
    npx electron $ScriptDir @args
}
