import { supabase } from './supabase';

type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_username?: string;
  sender_display_name?: string;
  sender_avatar_url?: string;
};

export type ChatMessage = MessageRow;

export const subscribeToMessages = (
  currentUserId: string,
  onMessage: (msg: ChatMessage) => void,
) => {
  const subscription = supabase
    .from('messages')
    .on('INSERT', (payload: any) => {
      const row = payload?.new as ChatMessage;
      if (!row) return;
      if (row.receiver_id === currentUserId || row.sender_id === currentUserId) {
        onMessage(row);
      }
    })
    .subscribe();

  return () => {
    if (subscription && typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe();
    }
  };
};
