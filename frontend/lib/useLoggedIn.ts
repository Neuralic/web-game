"use client";

import { useSyncExternalStore } from "react";
import { isAuthenticated } from "@/lib/auth";

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange); // a login/logout in another tab
  return () => window.removeEventListener("storage", onChange);
};

/**
 * Whether a login token exists. False on the server and during hydration, so server and first client render agree.
 * Used by the root layout to download code that only signed-in users need (chat widget, avatar picture sync) after login
 * rather than for every visitor. It is re-read whenever the calling component re-renders (e.g. on navigation).
 */
export function useLoggedIn(): boolean {
  return useSyncExternalStore(subscribe, isAuthenticated, () => false);
}
