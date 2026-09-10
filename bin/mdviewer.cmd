@echo off
setlocal
set "SCRIPT_DIR=%~dp0.."
if exist "%SCRIPT_DIR%\node_modules\electron\dist\electron.exe" (
  "%SCRIPT_DIR%\node_modules\electron\dist\electron.exe" "%SCRIPT_DIR%" %*
) else (
  npx electron "%SCRIPT_DIR%" %*
)
