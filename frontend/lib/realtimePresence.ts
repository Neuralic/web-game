import { supabase } from './supabase';

type PresenceData = {
  userId: string;
  username?: string;
  presenceStatus: string;
  currentGame?: string;
  lastOnline?: string;
};

type PresenceCallback = (data: PresenceData) => void;

let presenceChannel: any = null;
let callbacks: PresenceCallback[] = [];

export const onPresenceUpdate = (cb: PresenceCallback) => {
  callbacks.push(cb);
};

export const offPresenceUpdate = (cb?: PresenceCallback) => {
  if (!cb) {
    callbacks = [];
    return;
  }
  callbacks = callbacks.filter((c) => c !== cb);
};

export const joinPresence = async (userId: string, username?: string, currentGame?: string) => {
  try {
    // Global presence channel; can be scoped per-user if needed
    presenceChannel = supabase.channel('presence:global');

    presenceChannel.on('presence', (payload: any) => {
      const { join, leave } = payload || {};
      if (join) {
        Object.values(join).forEach((u: any) => {
          const data: PresenceData = {
            userId: String(u?.user_id ?? u?.userId ?? ''),
            username: String(u?.username ?? ''),
            presenceStatus: 'online',
            currentGame: u?.current_game ?? currentGame ?? '',
          };
          callbacks.forEach((cb) => cb(data));
        });
      }
      if (leave) {
        Object.values(leave).forEach((u: any) => {
          const data: PresenceData = {
            userId: String(u?.user_id ?? u?.userId ?? ''),
            presenceStatus: 'offline',
          };
          callbacks.forEach((cb) => cb(data));
        });
      }
    });

    await presenceChannel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        presenceChannel.track({
          user_id: userId,
          username: username ?? `user:${userId}`,
          presenceStatus: 'online',
          current_game: currentGame ?? null,
        });
      }
    });
  } catch (err) {
    console.error('Supabase presence join error:', err);
  }
};

export const leavePresence = async () => {
  try {
    if (presenceChannel && typeof presenceChannel.unsubscribe === 'function') {
      presenceChannel.unsubscribe();
    }
    presenceChannel = null;
  } catch (err) {
    console.error('Error leaving presence channel:', err);
  }
};
