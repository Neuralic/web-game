# AdventureBlox Studio Setup

An installer that copies the AdventureBlox plugin into your local Roblox
Studio Plugins folder.

## What it does

This does **not** modify, wrap, or replace Roblox Studio itself. It only
copies a plugin file into the standard, Roblox-supported Plugins directory
— the same mechanism any third-party Studio plugin uses. Roblox Studio
loads plugin files from `%LOCALAPPDATA%\Roblox\Plugins\` automatically;
this installer just puts the file there for you instead of you dragging
it in by hand.

1. Shows a dark, branded window ("AdventureBlox Studio Setup") with an
   Install button.
2. On click, searches `%LOCALAPPDATA%\Roblox\Versions\*\` for a local
   Roblox Studio install — checking for `RobloxStudioBeta.exe` first,
   then falling back to `RobloxStudio.exe` (the version folder name
   changes with every Roblox update, so it can't be hardcoded). If
   neither is found, shows an error and lets you retry after installing
   Studio.
3. Shows a short progress bar, then copies `AdventureBloxPlugin.lua` into
   `%LOCALAPPDATA%\Roblox\Plugins\` (creating that folder if it doesn't
   exist yet).
4. On success, shows: *"AdventureBlox Studio installed! Open Roblox Studio
   to see the AdventureBlox tab."*

## Before you distribute this to anyone

`AdventureBloxPlugin.lua` is currently a **placeholder** — see the comment
at the top of the file. Replace it with the real plugin source before
building anything you intend to hand to another person. Shipping the
placeholder would install a file that does nothing.

### Both files must ship together

`AdventureBloxPlugin.lua` is **not** embedded inside the compiled `.exe`,
so the installer only works if both files are sitting in the same folder
when someone runs it:

- `AdventureBloxStudioSetup.exe`
- `AdventureBloxPlugin.lua`

If only the `.exe` is shared, the installer will run but fail with
"Couldn't find AdventureBloxPlugin.lua next to the installer."

The easiest way to hand this to someone is to zip both files together
into one archive (e.g. `AdventureBloxStudioSetup.zip`) so there's a single
download and no risk of the two files getting separated.

## Requirements

- Python 3.9+ (tkinter is included with standard Windows Python installs)
- [PyInstaller](https://pyinstaller.org/): `pip install pyinstaller`
- An existing local Roblox Studio installation to install the plugin into

## Building

From inside `launcher\studio\`:

```
build.bat
```

This runs:

```
pyinstaller --onefile --noconsole --name "AdventureBloxStudioSetup" installer.py
```

The resulting executable is written to `dist\AdventureBloxStudioSetup.exe`.

**Important:** `AdventureBloxPlugin.lua` is not embedded inside the
compiled `.exe` (the build command has no `--add-data` step for it). The
installer expects to find `AdventureBloxPlugin.lua` sitting in the same
folder as `AdventureBloxStudioSetup.exe` at runtime. When distributing,
ship both files together — copy `AdventureBloxPlugin.lua` into `dist\`
alongside the executable, or zip them up together.

PyInstaller also creates a `build\` folder and an
`AdventureBloxStudioSetup.spec` file as build artifacts — safe to delete
or `.gitignore`, along with `dist\`.

## Running without building

```
python installer.py
```

(Also requires `AdventureBloxPlugin.lua` to be present in the same
folder.)

## Troubleshooting

- **"Roblox Studio not found"** — Studio isn't installed under the
  default per-user path. Install/open Roblox Studio at least once, then
  retry.
- **"Couldn't find AdventureBloxPlugin.lua next to the installer"** — the
  `.lua` file wasn't shipped alongside the `.exe`. See the Building
  section above.
- **Plugin doesn't show up in Studio** — fully close and reopen Roblox
  Studio after installing; plugins are loaded on startup.
