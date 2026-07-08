"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface UserAvatarProps {
  userId: string;
  username?: string;
  size?: number;
  className?: string;
  headshot?: boolean; // zoom in on head like Roblox
}

const cache: Record<string, string | null> = {};

export default function UserAvatar({ userId, username, size = 96, className = "", headshot = false }: UserAvatarProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(cache[userId] ?? null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    if (cache[userId] !== undefined) {
      setImageUrl(cache[userId]);
      return;
    }

    let cancelled = false;
    fetch(`${API_BASE}/avatar/render/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const url = data.imageUrl || null;
        cache[userId] = url;
        setImageUrl(url);
      })
      .catch(() => {
        if (!cancelled) cache[userId] = null;
      });

    return () => { cancelled = true; };
  }, [userId]);

  const style = { width: size, height: size };
  const initials = (username || "?")[0].toUpperCase();

  if (!imageUrl) {
    return (
      <div
        style={style}
        className={`rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 ${className}`}
      >
        <span className="text-gray-600 dark:text-gray-300 font-bold" style={{ fontSize: size * 0.35 }}>
          {initials}
        </span>
      </div>
    );
  }

  if (headshot) {
    return (
      <div
        style={style}
        className={`rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 ${className}`}
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
    <div style={style} className={`rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 ${className}`}>
      <img
        src={imageUrl}
        alt={username || "User avatar"}
        className={`w-full h-full object-contain transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
