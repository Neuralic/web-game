"use client";

import { useState, useEffect } from "react";
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
}

interface UserAdBannerProps {
  format: "728x90" | "160x600";
  className?: string;
}

export default function UserAdBanner({ format, className = "" }: UserAdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/ads/serve/${format}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.ad) {
          setAd(data.data.ad);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
      <div style={{ width: dimensions.width }} className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Advertisement</span>
        <div
          style={{ width: dimensions.width, height: dimensions.height }}
          className={`bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs font-medium border border-gray-300 dark:border-gray-600 ${className}`}
        >
          Advertisement ({format})
        </div>
      </div>
    );
  }

  const href = ad.groupId && ad.group_number
    ? `/groups/${ad.group_number}`
    : '#';

  return (
    <div style={{ width: dimensions.width }} className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Advertisement</span>
      <Link
        href={href}
        onClick={handleClick}
        target="_blank"
        style={{ width: dimensions.width, height: dimensions.height, display: 'block' }}
        className={`rounded overflow-hidden border border-gray-300 dark:border-gray-600 flex-shrink-0 ${className}`}
      >
        <img
          src={ad.imageUrl}
          alt={ad.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Link>
    </div>
  );
}
