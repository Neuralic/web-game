import { getSocket } from './socket';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_username?: string;
  sender_display_name?: string;
  sender_avatar_url?: string;
}

/**
 * Send a chat message via Socket.IO
 */
export const sendChatMessage = (
  receiverId: string,
  content: string,
  callback?: (response: { success: boolean; message?: ChatMessage; error?: string }) => void
) => {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit('chat:send', { receiverId, content }, callback);
  } else {
    callback?.({ success: false, error: 'Not connected' });
  }
};

/**
 * Listen for incoming chat messages
 */
export const onChatMessage = (callback: (message: ChatMessage) => void) => {
  const socket = getSocket();
  if (socket) {
    socket.on('chat:message', callback);
  }
};

/**
 * Stop listening for chat messages
 */
export const offChatMessage = (callback?: (message: ChatMessage) => void) => {
  const socket = getSocket();
  if (socket) {
    if (callback) {
      socket.off('chat:message', callback);
    } else {
      socket.off('chat:message');
    }
  }
};

/**
 * Send typing indicator
 */
export const sendTypingIndicator = (receiverId: string, isTyping: boolean) => {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit('chat:typing', { receiverId, isTyping });
  }
};

/**
 * Listen for typing indicators
 */
export const onTypingIndicator = (callback: (data: { userId: string; username: string; isTyping: boolean }) => void) => {
  const socket = getSocket();
  if (socket) {
    socket.on('chat:typing', callback);
  }
};

/**
 * Stop listening for typing indicators
 */
export const offTypingIndicator = (callback?: Function) => {
  const socket = getSocket();
  if (socket) {
    if (callback) {
      socket.off('chat:typing', callback as any);
    } else {
      socket.off('chat:typing');
    }
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = (senderId: string) => {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit('chat:read', { senderId });
  }
};

/**
 * Listen for read receipts
 */
export const onMessagesRead = (callback: (data: { userId: string }) => void) => {
  const socket = getSocket();
  if (socket) {
    socket.on('chat:read', callback);
  }
};

/**
 * Stop listening for read receipts
 */
export const offMessagesRead = (callback?: Function) => {
  const socket = getSocket();
  if (socket) {
    if (callback) {
      socket.off('chat:read', callback as any);
    } else {
      socket.off('chat:read');
    }
  }
};
