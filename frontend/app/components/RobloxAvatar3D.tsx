"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface Props {
  robloxUserId: string;
  onError?: () => void;
}

export default function RobloxAvatar3D({ robloxUserId, onError }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/avatar/roblox-3d/${robloxUserId}`);
        const data = await res.json();
        if (!data.success || !data.imageUrl) throw new Error("Failed");
        setImageUrl(data.imageUrl);
      } catch {
        onError?.();
      } finally {
        setLoading(false);
      }
    };

    if (robloxUserId) fetchAvatar();
  }, [robloxUserId, onError]);

  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-xs text-amber-700 dark:text-amber-300">Loading Roblox avatar...</p>
      </div>
    );
  }

  if (!imageUrl) return null;

  return (
    <div className="absolute inset-0 rounded-lg overflow-hidden">
      <img src={imageUrl} alt="Roblox Avatar" className="w-full h-full object-contain" />
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 px-3 py-1 rounded font-semibold text-sm text-gray-900 dark:text-gray-100 z-20">
        Roblox
      </div>
    </div>
  );
}