"use client";

import { useState } from "react";
import { useAvatarRenderState } from "./useAvatarRender";

interface UserAvatarProps {
  userId: string;
  username?: string;
  size?: number;
  className?: string;
  headshot?: boolean; // zoom in on head like Roblox
}

export default function UserAvatar({ userId, username, size = 96, className = "", headshot = false }: UserAvatarProps) {
  const { imageUrl, headUrl } = useAvatarRenderState(userId);
  const [loaded, setLoaded] = useState(false);

  const style = { width: size, height: size };
  const initials = (username || "?")[0].toUpperCase();

  if (!imageUrl) {
    return (
      <div
        style={style}
        className={`rounded-full bg-gray-300 dark:bg-[#242424] flex items-center justify-center flex-shrink-0 ${className}`}
      >
        <span className="text-gray-600 dark:text-gray-300 font-bold" style={{ fontSize: size * 0.35 }}>
          {initials}
        </span>
      </div>
    );
  }

  // Our own head/bust image (rendered from the 3D scene, every item included) is used as it is.
  if (headshot && headUrl) {
    return (
      <div
        style={style}
        className={`rounded-full overflow-hidden bg-gray-200 dark:bg-[#242424] flex-shrink-0 ${className}`}
      >
        <img src={headUrl} alt={username || "User avatar"} className="w-full h-full object-cover" onLoad={() => setLoaded(true)} />
      </div>
    );
  }

  // Roblox's render (fallback): a headshot is the full-body image zoomed in on the head.
  if (headshot) {
    return (
      <div
        style={style}
        className={`rounded-full overflow-hidden bg-gray-200 dark:bg-[#242424] flex-shrink-0 ${className}`}
      >
        <img
          src={imageUrl}
          alt={username || "User avatar"}
          className="w-full object-cover object-top"
          style={{ height: '240%', marginTop: '-15%' }}
          onLoad={() => setLoaded(true)}
        />
      </div>
    );
  }

  return (
    <div style={style} className={`rounded-full overflow-hidden bg-gray-200 dark:bg-[#242424] flex-shrink-0 ${className}`}>
      <img
        src={imageUrl}
        alt={username || "User avatar"}
        className={`w-full h-full object-contain transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
