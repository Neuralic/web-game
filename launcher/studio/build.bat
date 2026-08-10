@echo off
REM Builds AdventureBloxStudioSetup.exe from installer.py using PyInstaller.
REM Run this from inside the launcher\studio folder.

where pyinstaller >nul 2>nul
if errorlevel 1 (
    echo PyInstaller is not installed or not on PATH.
    echo Install it with: pip install pyinstaller
    exit /b 1
)

pyinstaller --onefile --noconsole --name "AdventureBloxStudioSetup" installer.py

echo.
echo Build finished. Find the executable in dist\AdventureBloxStudioSetup.exe
echo.
echo IMPORTANT: AdventureBloxPlugin.lua is NOT bundled into the exe.
echo Copy it into dist\ alongside AdventureBloxStudioSetup.exe before distributing.
