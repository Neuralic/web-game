"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { PresenceData } from '@/lib/realtime';

// The realtime module pulls in the whole Supabase client (~50 KB gzipped). Visitors who are not logged in never need it, so it is
// only loaded once there is a signed-in user to track.
type RealtimeModule = typeof import('@/lib/realtime');
import { isAuthenticated } from '@/lib/auth';
import { storage } from '@/lib/api';

interface RealtimeContextType {
  presenceMap: Map<string, PresenceData>;
  isConnected: boolean;
}

// How often a visible tab re-tracks its presence so lastOnline stays fresh (readers treat > 3 min as offline).
const PRESENCE_HEARTBEAT_MS = 60 * 1000;

const RealtimeContext = createContext<RealtimeContextType>({
  presenceMap: new Map(),
  isConnected: false,
});

export const useRealtime = () => useContext(RealtimeContext);

interface RealtimeProviderProps {
  children: ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  const handlePresenceUpdate = useCallback((presences: Map<string, PresenceData>) => {
    // Replace the whole map — Supabase 'sync' gives us the full current state
    setPresenceMap(new Map(presences));
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) return;

    const token = storage.getAccessToken();
    if (!token) return;

    let userId: string;
    let username: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId;
      username = payload.username;
    } catch {
      return;
    }

    let cancelled = false;
    let rt: RealtimeModule | null = null;
    let started = false;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    const stopHeartbeat = () => {
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }
    };
    const startHeartbeat = () => {
      stopHeartbeat();
      heartbeat = setInterval(() => {
        if (!rt) return;
        // A backgrounded tab is only kept alive for someone who pressed Play; once that has expired it goes offline as usual.
        if (document.visibilityState === 'hidden' && !rt.hasActivePlayingGame()) {
          stopHeartbeat();
          rt.disconnectPresence();
          return;
        }
        rt.refreshPresenceHeartbeat().catch(() => {});
      }, PRESENCE_HEARTBEAT_MS);
    };

    const initPresence = async () => {
      if (!rt) return;
      try {
        await rt.initializePresence(userId, username, handlePresenceUpdate);
        setIsConnected(true);
        if (document.visibilityState === 'visible') startHeartbeat();
      } catch (error) {
        console.error('Failed to initialize presence:', error);
        setIsConnected(false);
      }
    };

    // Mark offline when tab is hidden / closed
    const handleVisibilityChange = () => {
      if (!rt) return;
      if (document.visibilityState === 'hidden') {
        // Someone who just pressed Play is in the Roblox app with this tab in the background: keep showing them as in-game.
        if (rt.hasActivePlayingGame()) return;
        stopHeartbeat();
        rt.disconnectPresence();
      } else if (document.visibilityState === 'visible') {
        // Re-join when tab becomes visible again
        initPresence();
      }
    };

    const handleBeforeUnload = () => {
      stopHeartbeat();
      rt?.disconnectPresence();
    };

    import('@/lib/realtime')
      .then((module) => {
        if (cancelled) return;
        rt = module;
        started = true;
        initPresence();
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
      })
      .catch((error) => console.error('Failed to load realtime:', error));

    return () => {
      cancelled = true;
      stopHeartbeat();
      if (started) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        rt?.cleanupRealtimeChannels();
      }
      setIsConnected(false);
    };
  }, [handlePresenceUpdate]);

  return (
    <RealtimeContext.Provider value={{ presenceMap, isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
};
