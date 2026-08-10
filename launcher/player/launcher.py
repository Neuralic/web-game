"""
AdventureBlox Player launcher — splash screen + Roblox Player launch.

LOCAL / PERSONAL USE ONLY. Do not distribute this to other people.
See README.md for why: it launches Roblox Corporation's own
RobloxPlayerLauncher.exe under this app's branding, and Roblox's Terms of
Service do not allow repackaging or rebranding their client for other
people to use. Running it yourself, on your own machine, against your own
Roblox install, is a different thing than handing a compiled .exe to
someone else who doesn't know it's just launching Roblox underneath.
"""

import glob
import os
import subprocess
import tkinter as tk
from typing import Optional

WINDOW_WIDTH = 640
WINDOW_HEIGHT = 420
LOAD_DURATION_MS = 3000
LOAD_TICK_MS = 30

BG_COLOR = "#0a0a0a"
LOGO_COLOR = "#ffffff"
SUBTITLE_COLOR = "#9ca3af"
BAR_TROUGH_COLOR = "#1a1a1a"
BAR_FILL_COLOR = "#3b82f6"
ERROR_COLOR = "#f87171"


def find_roblox_player_launcher() -> Optional[str]:
    """Look for RobloxPlayerLauncher.exe under the default per-user Roblox
    install location. The version subfolder name changes with every Roblox
    update, so it can't be hardcoded — glob for it instead."""
    local_appdata = os.environ.get("LOCALAPPDATA")
    if not local_appdata:
        return None

    pattern = os.path.join(local_appdata, "Roblox", "Versions", "*", "RobloxPlayerLauncher.exe")
    matches = glob.glob(pattern)
    if matches:
        # If multiple versions are present, prefer the most recently modified.
        matches.sort(key=os.path.getmtime, reverse=True)
        return matches[0]
    return None


class SplashScreen(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("AdventureBlox Player")
        self.configure(bg=BG_COLOR)
        self.resizable(False, False)
        self.overrideredirect(True)  # borderless splash window
        self._center_window()

        self._build_ui()

        self._progress = 0.0
        self._elapsed_ms = 0
        self.after(LOAD_TICK_MS, self._tick_progress)

    def _center_window(self):
        screen_w = self.winfo_screenwidth()
        screen_h = self.winfo_screenheight()
        x = (screen_w - WINDOW_WIDTH) // 2
        y = (screen_h - WINDOW_HEIGHT) // 2
        self.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}+{x}+{y}")

    def _build_ui(self):
        container = tk.Frame(self, bg=BG_COLOR)
        container.pack(expand=True, fill="both")

        # Spacer to push the logo toward vertical center
        tk.Frame(container, bg=BG_COLOR, height=100).pack()

        logo_label = tk.Label(
            container,
            text="AdventureBlox",
            font=("Segoe UI", 36, "bold"),
            fg=LOGO_COLOR,
            bg=BG_COLOR,
        )
        logo_label.pack(pady=(0, 10))

        self.subtitle_label = tk.Label(
            container,
            text="Loading AdventureBlox Player...",
            font=("Segoe UI", 12),
            fg=SUBTITLE_COLOR,
            bg=BG_COLOR,
        )
        self.subtitle_label.pack(pady=(0, 30))

        bar_frame = tk.Frame(container, bg=BAR_TROUGH_COLOR, width=420, height=8)
        bar_frame.pack()
        bar_frame.pack_propagate(False)

        self.bar_fill = tk.Frame(bar_frame, bg=BAR_FILL_COLOR, width=0, height=8)
        self.bar_fill.place(x=0, y=0, relheight=1)
        self._bar_frame_width = 420

    def _tick_progress(self):
        self._elapsed_ms += LOAD_TICK_MS
        fraction = min(1.0, self._elapsed_ms / LOAD_DURATION_MS)
        self.bar_fill.configure(width=int(self._bar_frame_width * fraction))

        if fraction >= 1.0:
            self._launch_roblox()
        else:
            self.after(LOAD_TICK_MS, self._tick_progress)

    def _launch_roblox(self):
        self.subtitle_label.configure(text="Launching Roblox Player...")
        self.update_idletasks()

        launcher_path = find_roblox_player_launcher()

        if not launcher_path:
            self._show_error(
                "Couldn't find RobloxPlayerLauncher.exe.\n"
                "Make sure Roblox is installed, then try again."
            )
            return

        try:
            subprocess.Popen([launcher_path])
        except OSError as exc:
            self._show_error(f"Failed to launch Roblox Player:\n{exc}")
            return

        # Give the OS a moment to actually spawn the process before we
        # close our own window.
        self.after(800, self.destroy)

    def _show_error(self, message: str):
        self.subtitle_label.configure(text=message, fg=ERROR_COLOR, wraplength=520, justify="center")
        close_button = tk.Button(
            self,
            text="Close",
            command=self.destroy,
            bg="#1a1a1a",
            fg=LOGO_COLOR,
            activebackground="#242424",
            activeforeground=LOGO_COLOR,
            relief="flat",
            padx=20,
            pady=6,
        )
        close_button.pack(pady=10)


def main():
    app = SplashScreen()
    app.mainloop()


if __name__ == "__main__":
    main()
