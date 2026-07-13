"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { storage } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface GroupAd {
  id: string;
  name: string;
  imageUrl: string;
  format: string;
  groupId?: string;
  group_name?: string;
  group_number?: number;
}

interface UserSelfPromoAdBannerProps {
  className?: string;
}

export default function UserSelfPromoAdBanner({ className = "" }: UserSelfPromoAdBannerProps) {
  const [ad, setAd] = useState<GroupAd | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = storage.getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/ads/my-group-ad`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.ad) {
          setAd(data.data.ad);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !ad) return null;

  const href = ad.groupId && ad.group_number ? `/groups/${ad.group_number}` : "#";

  return (
    <div className={`w-full px-6 py-4 border-b border-gray-100 dark:border-gray-800 ${className}`}>
      <span className="block text-xs text-blue-600 dark:text-blue-400 uppercase font-semibold tracking-wide mb-1">
        Your Group&apos;s Ad
      </span>
      <Link
        href={href}
        className="block w-full h-[120px] rounded overflow-hidden border-2 border-blue-500"
      >
        <img
          src={ad.imageUrl}
          alt={ad.name}
          className="w-full h-full object-cover"
        />
      </Link>
    </div>
  );
}
