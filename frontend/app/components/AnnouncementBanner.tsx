"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const DISMISSED_KEY = "dismissedAnnouncementId";

interface Announcement {
  id: string;
  message: string;
}

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await fetch(`${API_BASE}/announcements/active`);
        const data = await res.json();
        if (data.success && data.data?.announcement) {
          const active: Announcement = data.data.announcement;
          setAnnouncement(active);
          if (sessionStorage.getItem(DISMISSED_KEY) === active.id) {
            setDismissed(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch announcement:", error);
      }
    };

    fetchAnnouncement();
  }, []);

  const handleDismiss = () => {
    if (announcement) {
      sessionStorage.setItem(DISMISSED_KEY, announcement.id);
    }
    setDismissed(true);
  };

  if (!announcement || dismissed) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-center relative">
      <p className="text-sm font-medium text-center pr-8">{announcement.message}</p>
      <button
        onClick={handleDismiss}
        title="Dismiss"
        className="absolute right-4 p-1 hover:bg-blue-700 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
