"""
AdventureBlox Studio installer — copies the AdventureBlox plugin into the
user's local Roblox Studio Plugins folder.

This does not modify, wrap, or replace Roblox Studio itself. It only adds
a third-party plugin file to the standard, Roblox-supported Plugins
directory — the same mechanism any Studio plugin uses.
"""

import glob
import os
import shutil
import sys
import tkinter as tk
from typing import Optional

WINDOW_WIDTH = 640
WINDOW_HEIGHT = 380

BG_COLOR = "#0a0a0a"
TITLE_COLOR = "#ffffff"
SUBTITLE_COLOR = "#9ca3af"
BAR_TROUGH_COLOR = "#1a1a1a"
BAR_FILL_COLOR = "#3b82f6"
SUCCESS_COLOR = "#4ade80"
ERROR_COLOR = "#f87171"
BUTTON_BG = "#3b82f6"
BUTTON_BG_HOVER = "#2563eb"

PLUGIN_FILENAME = "AdventureBloxPlugin.lua"

PROGRESS_DURATION_MS = 1200
PROGRESS_TICK_MS = 30


def get_base_dir() -> str:
    """Folder the installer is running from — where AdventureBloxPlugin.lua
    is expected to sit alongside the .exe (it isn't bundled inside it,
    since build.bat doesn't pass --add-data)."""
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


def find_roblox_studio() -> Optional[str]:
    """Find RobloxStudio.exe under the default per-user install location.
    The version subfolder name changes with every Roblox update, so it
    can't be hardcoded — glob for it instead."""
    local_appdata = os.environ.get("LOCALAPPDATA")
    if not local_appdata:
        return None

    pattern = os.path.join(local_appdata, "Roblox", "Versions", "*", "RobloxStudio.exe")
    matches = glob.glob(pattern)
    if matches:
        matches.sort(key=os.path.getmtime, reverse=True)
        return matches[0]
    return None


def get_plugins_dir() -> str:
    local_appdata = os.environ.get("LOCALAPPDATA", "")
    return os.path.join(local_appdata, "Roblox", "Plugins")


class InstallerApp(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("AdventureBlox Studio Setup")
        self.configure(bg=BG_COLOR)
        self.resizable(False, False)
        self._center_window()

        self._progress_elapsed_ms = 0
        self._installing = False

        self._build_ui()

    def _center_window(self):
        screen_w = self.winfo_screenwidth()
        screen_h = self.winfo_screenheight()
        x = (screen_w - WINDOW_WIDTH) // 2
        y = (screen_h - WINDOW_HEIGHT) // 2
        self.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}+{x}+{y}")

    def _build_ui(self):
        container = tk.Frame(self, bg=BG_COLOR)
        container.pack(expand=True, fill="both")

        tk.Frame(container, bg=BG_COLOR, height=70).pack()

        title_label = tk.Label(
            container,
            text="AdventureBlox Studio Setup",
            font=("Segoe UI", 22, "bold"),
            fg=TITLE_COLOR,
            bg=BG_COLOR,
        )
        title_label.pack(pady=(0, 8))

        self.status_label = tk.Label(
            container,
            text="Installs the AdventureBlox plugin for Roblox Studio",
            font=("Segoe UI", 11),
            fg=SUBTITLE_COLOR,
            bg=BG_COLOR,
            wraplength=520,
            justify="center",
        )
        self.status_label.pack(pady=(0, 30))

        bar_frame = tk.Frame(container, bg=BAR_TROUGH_COLOR, width=420, height=8)
        bar_frame.pack()
        bar_frame.pack_propagate(False)
        self._bar_frame_width = 420

        self.bar_fill = tk.Frame(bar_frame, bg=BAR_FILL_COLOR, width=0, height=8)
        self.bar_fill.place(x=0, y=0, relheight=1)

        self.install_button = tk.Button(
            container,
            text="Install",
            command=self._on_install_click,
            font=("Segoe UI", 11, "bold"),
            fg="#ffffff",
            bg=BUTTON_BG,
            activebackground=BUTTON_BG_HOVER,
            activeforeground="#ffffff",
            relief="flat",
            padx=30,
            pady=8,
            cursor="hand2",
        )
        self.install_button.pack(pady=(30, 0))

    def _on_install_click(self):
        if self._installing:
            return

        studio_path = find_roblox_studio()
        if not studio_path:
            self._show_error(
                "Roblox Studio not found.\nPlease install Roblox Studio first, then run this setup again."
            )
            return

        self._installing = True
        self.install_button.configure(state="disabled", text="Installing...")
        self.status_label.configure(text="Installing AdventureBlox Studio plugin...", fg=SUBTITLE_COLOR)
        self._progress_elapsed_ms = 0
        self._tick_progress()

    def _tick_progress(self):
        self._progress_elapsed_ms += PROGRESS_TICK_MS
        fraction = min(1.0, self._progress_elapsed_ms / PROGRESS_DURATION_MS)
        self.bar_fill.configure(width=int(self._bar_frame_width * fraction))

        if fraction >= 1.0:
            self._do_install()
        else:
            self.after(PROGRESS_TICK_MS, self._tick_progress)

    def _do_install(self):
        source_path = os.path.join(get_base_dir(), PLUGIN_FILENAME)

        if not os.path.isfile(source_path):
            self._show_error(
                f"Couldn't find {PLUGIN_FILENAME} next to the installer.\n"
                "Make sure it's in the same folder as this setup program."
            )
            return

        plugins_dir = get_plugins_dir()

        try:
            os.makedirs(plugins_dir, exist_ok=True)
            shutil.copy2(source_path, os.path.join(plugins_dir, PLUGIN_FILENAME))
        except OSError as exc:
            self._show_error(f"Failed to install the plugin:\n{exc}")
            return

        self._show_success()

    def _show_success(self):
        self._installing = False
        self.status_label.configure(
            text="AdventureBlox Studio installed! Open Roblox Studio to see the AdventureBlox tab.",
            fg=SUCCESS_COLOR,
        )
        self.install_button.configure(state="normal", text="Done", command=self.destroy)

    def _show_error(self, message: str):
        self._installing = False
        self.bar_fill.configure(width=0)
        self.status_label.configure(text=message, fg=ERROR_COLOR)
        self.install_button.configure(state="normal", text="Retry")


def main():
    app = InstallerApp()
    app.mainloop()


if __name__ == "__main__":
    main()
