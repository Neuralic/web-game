"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useAvatarRenderState, invalidateAvatarRender } from "./useAvatarRender";

const Avatar3DViewer = dynamic(() => import("./Avatar3DViewer"), { ssr: false });

interface AvatarPreviewProps {
  userId: string;
  /** Size/position classes for the preview box (the viewer and the 2D image both fill it). */
  className?: string;
  /** Bumped after the outfit changed: refreshes the 3D viewer and drops the cached 2D render. */
  refreshKey?: number;
  /** "profile": dark translucent badge, top-right. "editor": light badge, bottom-right. */
  variant?: "profile" | "editor";
}

type Mode = "3d" | "2d";

/** The 2D Roblox render. Only mounted in 2D mode, so nothing is requested until the user asks for it. */
function Avatar2DView({ userId, className }: { userId: string; className: string }) {
  const { imageUrl, loading } = useAvatarRenderState(userId);
  return (
    <div className={`relative bg-[#1a1a1a] rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
      {imageUrl ? (
        <img src={imageUrl} alt="Avatar" className="h-full object-contain" />
      ) : loading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <p className="text-xs text-gray-400">Loading 2D render...</p>
        </div>
      ) : (
        <div className="text-gray-500 text-sm">2D render unavailable</div>
      )}
    </div>
  );
}

/** 3D viewer with a working 3D / 2D toggle. Starts in 3D. */
export default function AvatarPreview({ userId, className = "", refreshKey = 0, variant = "profile" }: AvatarPreviewProps) {
  const [mode, setMode] = useState<Mode>("3d");

  // The outfit changed: the cached 2D render is stale. Done during render (idempotent) so the 2D view,
  // if open, remounts below with the cache already cleared.
  const [seenKey, setSeenKey] = useState(refreshKey);
  if (seenKey !== refreshKey) {
    setSeenKey(refreshKey);
    if (userId) invalidateAvatarRender(userId);
  }

  const wrap =
    variant === "editor"
      ? "absolute bottom-4 right-4 z-20 flex rounded overflow-hidden bg-white dark:bg-[#1a1a1a] font-semibold text-sm"
      : "absolute top-2 right-2 z-20 flex rounded overflow-hidden bg-black/60 text-white text-xs font-bold";
  const pad = variant === "editor" ? "px-3 py-1" : "px-2 py-0.5";
  const active =
    variant === "editor"
      ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
      : "bg-white text-black";
  const idle =
    variant === "editor"
      ? "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
      : "text-white hover:bg-white/20";

  const button = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      aria-pressed={mode === m}
      className={`${pad} transition-colors ${mode === m ? active : idle}`}
    >
      {label}
    </button>
  );

  return (
    <div className={`relative ${className}`}>
      {mode === "3d" ? (
        <Avatar3DViewer userId={userId} refreshKey={refreshKey} className="w-full h-full rounded-none" />
      ) : (
        <Avatar2DView key={refreshKey} userId={userId} className="w-full h-full rounded-none" />
      )}
      <div className={wrap}>
        {button("3d", "3D")}
        {button("2d", "2D")}
      </div>
    </div>
  );
}
