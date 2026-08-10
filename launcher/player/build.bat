@echo off
REM Builds AdventureBloxPlayer.exe from launcher.py using PyInstaller.
REM Run this from inside the launcher\player folder.

where pyinstaller >nul 2>nul
if errorlevel 1 (
    echo PyInstaller is not installed or not on PATH.
    echo Install it with: pip install pyinstaller
    exit /b 1
)

pyinstaller --onefile --noconsole --name "AdventureBloxPlayer" launcher.py

echo.
echo Build finished. Find the executable in dist\AdventureBloxPlayer.exe
