"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface Ad {
  id: string;
  name: string;
  imageUrl: string;
  format: string;
  groupId?: string;
  group_name?: string;
  group_number?: number;
  gameId?: string;
  game_title?: string;
  profileId?: string;
  profileUsername?: string;
}

interface UserAdBannerProps {
  format: "728x90" | "160x600";
  className?: string;
}

// Two banners of the same format on one page (left and right skyscraper) ask for an ad in the same moment. They share one request
// (every request counts an impression on the server). The window is short, so a later page view still gets a fresh ad.
const SHARE_MS = 3000;
const shared = new Map<string, { at: number; promise: Promise<Ad | null> }>();

function fetchAd(format: string): Promise<Ad | null> {
  const hit = shared.get(format);
  if (hit && Date.now() - hit.at < SHARE_MS) return hit.promise;
  const promise = fetch(`${API_BASE}/ads/serve/${format}`)
    .then((r) => r.json())
    .then((data) => (data.success && data.data?.ad ? (data.data.ad as Ad) : null))
    .catch(() => null);
  shared.set(format, { at: Date.now(), promise });
  return promise;
}

export default function UserAdBanner({ format, className = "" }: UserAdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const isShown = () => !!rootRef.current && rootRef.current.getClientRects().length > 0;
    const load = () =>
      fetchAd(format).then((found) => {
        if (cancelled) return;
        if (found) setAd(found);
        setLoading(false);
      });

    if (isShown()) {
      load();
      return () => { cancelled = true; };
    }
    // Not displayed at this screen size (the skyscrapers are hidden below xl): no request and no impression for an ad nobody can
    // see. If the window grows so it is shown, it loads then.
    const onResize = () => {
      if (!isShown()) return;
      window.removeEventListener("resize", onResize);
      load();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [format]);

  const handleClick = async () => {
    if (!ad) return;
    await fetch(`${API_BASE}/ads/${ad.id}/click`, { method: 'POST' }).catch(() => {});
  };

  const dimensions = format === '728x90'
    ? { width: '728px', height: '90px' }
    : { width: '160px', height: '600px' };

  if (loading || !ad) {
    return (
      <div ref={rootRef} style={{ width: dimensions.width }} className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Advertisement</span>
        <div
          style={{ width: dimensions.width, height: dimensions.height }}
          className={`bg-gray-200 dark:bg-[#242424] rounded flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs font-medium border border-gray-300 dark:border-[#2a2a2a] ${className}`}
        >
          Advertisement ({format})
        </div>
      </div>
    );
  }

  const href = ad.profileId && ad.profileUsername
    ? `/profile/${ad.profileUsername}`
    : ad.gameId
    ? `/games/${ad.gameId}`
    : ad.groupId && ad.group_number
    ? `/groups/${ad.group_number}`
    : '#';

  return (
    <div ref={rootRef} style={{ width: dimensions.width }} className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Advertisement</span>
      <Link
        href={href}
        onClick={handleClick}
        target="_blank"
        style={{ width: dimensions.width, height: dimensions.height, display: 'block' }}
        className={`rounded overflow-hidden border border-gray-300 dark:border-[#2a2a2a] flex-shrink-0 ${className}`}
      >
        <img
          src={ad.imageUrl}
          alt={ad.name}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Link>
    </div>
  );
}
