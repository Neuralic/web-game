# AdventureBlox Player Launcher

A branded splash screen that launches your local Roblox Player install.

## ⚠️ Local use only — do not distribute

**This is for your own machine, not for handing to other people.**

This launcher shows AdventureBlox branding and then runs the real
`RobloxPlayerLauncher.exe` from your own Roblox installation — it does not
contain, replace, or reimplement any part of Roblox. That's fine when
you're the one running it and you know exactly what it does. It stops
being fine the moment someone else runs a compiled copy without knowing
that "AdventureBlox Player" is actually just launching Roblox Corporation's
own client underneath a different name.

Two concrete reasons not to ship this to anyone else:

1. **Roblox's Terms of Service** prohibit repackaging, rebranding, or
   creating unauthorized wrapper/derivative clients around their software,
   and prohibit using their branding in ways that imply affiliation you
   don't have.
2. **It's misleading to the end user.** A stranger installing
   "AdventureBloxPlayer.exe" has no way to know it's secretly Roblox's own
   launcher unless you tell them — and this splash screen doesn't tell them.

If you ever do want to share something like this with other people, make
it honest instead: have the splash screen say plainly that it's launching
Roblox Player (e.g. "AdventureBlox uses Roblox — launching Roblox
Player..."), so nobody is misled about what's actually running on their
machine.

## What it does

1. Shows a dark, branded splash window with an "AdventureBlox" wordmark
   and a loading bar that fills over ~3 seconds.
2. Searches `%LOCALAPPDATA%\Roblox\Versions\*\RobloxPlayerLauncher.exe`
   for your local Roblox install (the version folder name changes with
   every Roblox update, so it can't be hardcoded).
3. Launches it via `subprocess.Popen`.
4. Closes the splash shortly after.
5. If Roblox isn't found (or fails to launch), the splash shows an error
   instead of silently failing, with a Close button.

## Requirements

- Python 3.9+ (tkinter is included with standard Windows Python installs)
- [PyInstaller](https://pyinstaller.org/): `pip install pyinstaller`
- An existing local Roblox installation (this launcher does not install
  Roblox for you)

## Building

From inside `launcher\player\`:

```
build.bat
```

This runs:

```
pyinstaller --onefile --noconsole --name "AdventureBloxPlayer" launcher.py
```

The resulting executable is written to `dist\AdventureBloxPlayer.exe`.
PyInstaller also creates a `build\` folder and an `AdventureBloxPlayer.spec`
file as build artifacts — safe to delete or `.gitignore` both, along with
`dist\`.

## Running without building

You can also just run the script directly, no compilation needed:

```
python launcher.py
```

## Troubleshooting

- **"Couldn't find RobloxPlayerLauncher.exe"** — Roblox isn't installed
  under the default per-user path, or you're on a machine that installed
  it somewhere nonstandard. Confirm Roblox actually launches normally
  first.
- **Windows Defender / SmartScreen flags the .exe** — this is normal and
  expected for unsigned PyInstaller executables, especially ones that
  launch another program. Since this is for local use only, that's not a
  problem to solve by trying to look more "trustworthy" to end users —
  see the distribution warning above.
