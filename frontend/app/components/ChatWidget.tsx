'use client';

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import UserAvatar from "./UserAvatar";
import { MessageSquare, X, Send } from "lucide-react";
import { usePathname } from "next/navigation";
import { messagesApi, friendsApi } from "@/lib/api";
import { sendChatMessage, subscribeToMessages, unsubscribeFromMessages, subscribeToTyping, unsubscribeFromTyping, broadcastTyping } from "@/lib/realtime";
import { startChatUnread, stopChatUnread, registerConversationViewing, useChatUnread } from "@/lib/chatUnread";
import ChatSoundToggle from "./ChatSoundToggle";
import { useRealtime } from "@/contexts/RealtimeContext";
import type { ChatMessage } from "@/lib/realtime";

interface Friend {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  presence_status?: string;
}

interface Conversation {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  presence_status?: string;
  last_message?: string;
  last_message_time?: string;
}

interface ChatWindow {
  id: string;
  name: string;
  avatar: string;
  username: string;
  displayName?: string;
  messages: ChatMessage[];
  isLoadingMessages: boolean;
}

// Global function to open chat from external components
let globalOpenChat: ((userId: string, username: string, displayName?: string, avatarUrl?: string) => void) | null = null;

export const openChatWithUser = (userId: string, username: string, displayName?: string, avatarUrl?: string) => {
  if (globalOpenChat) {
    globalOpenChat(userId, username, displayName, avatarUrl);
  }
};

const CHAT_WINDOW_WIDTH = 384; // w-96
const GAP = 16;
const PANEL_COLUMN = 16 + CHAT_WINDOW_WIDTH + GAP; // right-4 + panel width + gap

export default function ChatWidget() {
  const pathname = usePathname();
  const hiddenPaths = ['/messages', '/login', '/signup', '/continue'];
  const isHidden = hiddenPaths.some(p => pathname === p || pathname?.startsWith(p + '/'));

  const [activePanel, setActivePanel] = useState<'chat' | 'party' | null>(null);
  const [openChats, setOpenChats] = useState<ChatWindow[]>([]);
  const [messageInputs, setMessageInputs] = useState<{ [key: string]: string }>({});
  const [messageErrors, setMessageErrors] = useState<{ [key: string]: string }>({});
  const [friends, setFriends] = useState<Friend[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: boolean }>({});
  const typingTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const typingBroadcastTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const currentUserIdRef = useRef<string | null>(null);
  const { presenceMap } = useRealtime();
  const messagesEndRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const openChatsRef = useRef<ChatWindow[]>([]);
  openChatsRef.current = openChats;
  // Unread counts come from the shared store (also used by the Messages page and the header bell), never from this list
  const { counts: unreadCounts, total: totalUnread } = useChatUnread();
  // How many chat windows fit side by side; older ones stay open but are not drawn until brought back to the front
  const [windowCapacity, setWindowCapacity] = useState(2);

  // Decode current user ID once
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserIdRef.current = payload.userId;
    } catch {}
  }, []);

  // Register global chat opener
  useEffect(() => {
    globalOpenChat = (userId: string, username: string, displayName?: string, avatarUrl?: string) => {
      showChat({
        id: userId,
        name: displayName || username,
        avatar: avatarUrl || `https://robohash.org/${username}?set=set3`,
        username: `@${username}`,
        messages: [],
        isLoadingMessages: false,
      });
    };

    return () => {
      globalOpenChat = null;
    };
  }, []);

  // Load friends and conversations on mount
  useEffect(() => {
    loadFriends();
    loadConversations();
  }, []);

  // Unread counts + the new-message sound: one shared listener for the whole app (see lib/chatUnread.ts)
  useEffect(() => {
    startChatUnread();
    return () => stopChatUnread();
  }, []);

  // Keeps the conversation list preview/order current from incoming messages without a full re-fetch
  // (the unread numbers themselves come from the shared store)
  useEffect(() => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<{ senderId: string; content: string; createdAt: string }>).detail;
      setConversations(prev => {
        if (!prev.some(c => c.id === msg.senderId)) {
          loadConversations(); // new conversation: fetch to get the user's info
          return prev;
        }
        return prev
          .map(c => (c.id === msg.senderId ? { ...c, last_message: msg.content, last_message_time: msg.createdAt } : c))
          .sort((a, b) => new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime());
      });
    };
    window.addEventListener('ab:chat-incoming', handler);
    return () => window.removeEventListener('ab:chat-incoming', handler);
  }, []);

  // How many windows fit: full-width single window on phones, otherwise as many as the screen holds
  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      setWindowCapacity(
        width < 640 ? 1 : Math.max(1, Math.floor((width - PANEL_COLUMN) / (CHAT_WINDOW_WIDTH + GAP)))
      );
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const visibleChats = openChats.slice(-windowCapacity);
  const visibleChatKey = visibleChats.map(c => c.id).join(',');

  // A conversation counts as "being read" while its window is drawn (and the tab is in front): opening it clears its
  // unread count, and messages arriving meanwhile are read on arrival, with no badge and no sound
  useEffect(() => {
    const unregister = visibleChats.map(c => registerConversationViewing(c.id));
    return () => unregister.forEach(fn => fn());
  }, [visibleChatKey]);

  // Keep the newest message in view when the chat is opened, a message is sent, or one arrives
  const messageCountKey = visibleChats.map(c => `${c.id}:${c.messages.length}`).join(',');
  useEffect(() => {
    visibleChats.forEach(c => messagesEndRef.current[c.id]?.scrollIntoView({ block: 'end' }));
  }, [messageCountKey]);

  // Subscribe to messages + typing for open chats
  useEffect(() => {
    const userId = currentUserIdRef.current;
    if (!userId) return;

    openChats.forEach(chat => {
      subscribeToMessages(userId, chat.id, (message: ChatMessage) => {
        setOpenChats(prev => prev.map(c =>
          c.id === chat.id ? { ...c, messages: [...c.messages.filter(m => m.id !== message.id), message] } : c
        ));
        // Read/unread is decided by the shared store (open + tab in front = read on arrival), not here
      });

      subscribeToTyping(userId, chat.id, (isTyping) => {
        setTypingUsers(prev => ({ ...prev, [chat.id]: isTyping }));
        if (typingTimeouts.current[chat.id]) clearTimeout(typingTimeouts.current[chat.id]);
        if (isTyping) {
          typingTimeouts.current[chat.id] = setTimeout(() => {
            setTypingUsers(prev => ({ ...prev, [chat.id]: false }));
          }, 3000);
        }
      });
    });

    return () => {
      openChats.forEach(chat => {
        unsubscribeFromMessages(userId, chat.id);
        unsubscribeFromTyping(userId, chat.id);
      });
    };
  }, [openChats.map(c => c.id).sort().join(',')]);

  const loadFriends = async () => {
    const response = await friendsApi.getFriends();
    if (response.success && response.data) {
      setFriends(response.data.friends as Friend[]);
    }
  };

  const loadConversations = async () => {
    const response = await messagesApi.getConversations();
    if (response.success && response.data) {
      setConversations(response.data.conversations as Conversation[]);
    }
  };

  const loadMessages = async (userId: string) => {
    setOpenChats(prev => prev.map(chat => 
      chat.id === userId ? { ...chat, isLoadingMessages: true } : chat
    ));

    const response = await messagesApi.getMessages(userId);
    if (response.success && response.data) {
      setOpenChats(prev => prev.map(chat => 
        chat.id === userId 
          ? { ...chat, messages: response.data!.messages as ChatMessage[], isLoadingMessages: false }
          : chat
      ));
      // The server marks the conversation read when its messages are fetched; the shared store clears the badge
    }
  };

  // Merge conversations and friends into one unified list
  const allContacts = [
    ...conversations.map(conv => ({ ...conv, type: 'conversation' as const })),
    ...friends.filter(friend => !conversations.some(conv => conv.id === friend.id)).map(friend => ({ ...friend, type: 'friend' as const }))
  ];

  const filteredContacts = allContacts.filter(contact => 
    contact.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Opens a chat window, or brings an already-open one to the front (the newest windows are the ones drawn)
  const showChat = (chat: ChatWindow) => {
    const existing = openChatsRef.current.find(c => c.id === chat.id);
    if (existing) {
      setOpenChats(prev => [...prev.filter(c => c.id !== chat.id), prev.find(c => c.id === chat.id) ?? existing]);
    } else {
      setOpenChats(prev => [...prev, chat]);
      loadMessages(chat.id);
    }
    setActivePanel(null);
  };

  const openChatWindow = (conv: Conversation) => {
    showChat({
      id: conv.id,
      name: conv.display_name || conv.username,
      avatar: conv.avatar_url || `https://robohash.org/${conv.username}?set=set3`,
      username: `@${conv.username}`,
      messages: [],
      isLoadingMessages: false,
    });
  };

  const openChatWindowFromFriend = (friend: Friend) => {
    showChat({
      id: friend.id,
      name: friend.display_name || friend.username,
      avatar: friend.avatar_url || `https://robohash.org/${friend.username}?set=set3`,
      username: `@${friend.username}`,
      messages: [],
      isLoadingMessages: false,
    });
  };

  const closeChatWindow = (chatId: string) => {
    setOpenChats(prev => prev.filter(chat => chat.id !== chatId));
    delete messageInputs[chatId];
  };

  const handleSendMessage = async (chatId: string) => {
    const message = messageInputs[chatId];
    if (message && message.trim()) {
      setMessageErrors(prev => ({ ...prev, [chatId]: "" }));
      const response = await sendChatMessage(chatId, message.trim());
      if (response.success && response.message) {
        // Add message to chat
        setOpenChats(prev => prev.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages: [...chat.messages, response.message!]
            };
          }
          return chat;
        }));

        // Clear input
        setMessageInputs({ ...messageInputs, [chatId]: "" });

        // Update conversations
        loadConversations();
      } else {
        setMessageErrors(prev => ({ ...prev, [chatId]: response.error || "Failed to send message" }));
      }
    }
  };

  const handleInputChange = (chatId: string, value: string) => {
    setMessageInputs({ ...messageInputs, [chatId]: value });
    if (messageErrors[chatId]) {
      setMessageErrors(prev => ({ ...prev, [chatId]: "" }));
    }

    const userId = currentUserIdRef.current;
    if (!userId) return;

    // Broadcast typing
    broadcastTyping(userId, chatId, true);

    if (typingBroadcastTimeouts.current[chatId]) clearTimeout(typingBroadcastTimeouts.current[chatId]);
    typingBroadcastTimeouts.current[chatId] = setTimeout(() => {
      broadcastTyping(userId, chatId, false);
    }, 1500);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPresenceStatus = (userId: string) => {
    const presence = presenceMap.get(userId);
    return presence?.presenceStatus || 'offline';
  };

  return (
    <>
      {/* Unified Chat/Party Panel — full width on phones */}
      {activePanel !== null && (
        <div
          className="fixed bottom-11 right-0 sm:right-4 w-full sm:w-96 bg-[#1a1a1a] rounded-t-lg shadow-2xl border border-[#2a2a2a] flex flex-col z-50"
          style={{ maxHeight: 'min(640px, calc(100dvh - 4.5rem))' }}
        >
          {/* Header with tabs */}
          <div className="flex items-center px-3 py-2.5 bg-[#1a1a1a] border-b border-[#2a2a2a] rounded-t-lg gap-3">
            <button
              onClick={() => setActivePanel('chat')}
              className={`text-sm font-bold pb-0.5 transition-colors ${activePanel === 'chat' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Chat
            </button>
            <button
              onClick={() => setActivePanel('party')}
              className={`text-sm font-bold pb-0.5 transition-colors ${activePanel === 'party' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Party
            </button>
            <div className="flex-1" />
            <ChatSoundToggle className="hover:bg-[#2a2a2a]" />
            <button
              onClick={() => setActivePanel(null)}
              className="p-1 hover:bg-[#2a2a2a] rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {activePanel === 'chat' ? (
            <>
              {/* Search */}
              <div className="p-2.5 border-b border-[#2a2a2a]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search friends and conversations"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded px-3 py-1.5 pl-8 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>

              {/* Unified Contacts List */}
              <div className="flex-1 overflow-y-auto">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => {
                    const isConversation = contact.type === 'conversation';
                    return (
                      <button
                        key={contact.id}
                        onClick={() => isConversation ? openChatWindow(contact) : openChatWindowFromFriend(contact)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#242424] transition-colors border-b border-[#2a2a2a] last:border-b-0"
                      >
                        <div className="relative flex-shrink-0">
                          <UserAvatar userId={contact.id} username={contact.display_name || contact.username} size={36} headshot />
                          {getPresenceStatus(contact.id) !== 'offline' && (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#1a1a1a]"></div>
                          )}
                          {(unreadCounts[contact.id] || 0) > 0 && (
                            <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center font-bold">
                              {unreadCounts[contact.id] > 99 ? '99+' : unreadCounts[contact.id]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm text-white truncate">
                              {contact.display_name || contact.username}
                            </p>
                            {isConversation && contact.last_message_time && (
                              <span className="text-[10px] text-gray-500 ml-2 flex-shrink-0">
                                {formatTime(contact.last_message_time)}
                              </span>
                            )}
                          </div>
                          {isConversation && contact.last_message ? (
                            <p className="text-xs text-gray-400 truncate">
                              {contact.last_message}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500">
                              {getPresenceStatus(contact.id) === 'online' ? 'Online' : getPresenceStatus(contact.id) === 'in-game' ? 'Playing' : 'Offline'}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <MessageSquare className="w-10 h-10 text-gray-600 mb-3" />
                    <p className="text-sm text-gray-400">No contacts yet</p>
                    <p className="text-xs text-gray-500 mt-1">Start chatting with your friends!</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center flex-1">
              <span className="text-3xl mb-3">🎮</span>
              <p className="text-sm text-gray-400">Party feature coming soon</p>
            </div>
          )}
        </div>
      )}

      {/* Individual Chat Windows — stack left starting past the panel column; one full-width window on phones */}
      {visibleChats.map((chat, index) => (
        <div
          key={chat.id}
          className="fixed bottom-11 right-0 sm:right-[var(--chat-right)] w-full sm:w-96 bg-[#1a1a1a] rounded-t-lg shadow-2xl border border-[#2a2a2a] flex flex-col z-50"
          style={{
            height: 'min(560px, calc(100dvh - 4.5rem))',
            '--chat-right': `${PANEL_COLUMN + index * (CHAT_WINDOW_WIDTH + GAP)}px`,
          } as React.CSSProperties}
        >
          {/* Chat Header */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#1a1a1a] border-b border-[#2a2a2a] rounded-t-lg">
            <UserAvatar userId={chat.id} username={chat.displayName || chat.name} size={32} headshot />
            <h3 className="flex-1 font-bold text-[15px] text-white truncate">
              {chat.name}
            </h3>
            <ChatSoundToggle className="hover:bg-[#2a2a2a]" />
            <button
              onClick={() => closeChatWindow(chat.id)}
              className="p-1 hover:bg-[#2a2a2a] rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-[#0a0a0a]">
            {chat.isLoadingMessages ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Loading messages...
              </div>
            ) : chat.messages.length === 0 ? (
              <div className="text-center py-8">
                <UserAvatar userId={chat.id} username={chat.displayName || chat.name} size={72} headshot />
                <h4 className="font-bold text-white mb-1 mt-2">
                  {chat.name}
                </h4>
                <p className="text-xs text-gray-500 mb-4">
                  {chat.username}
                </p>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 max-w-[200px] mx-auto">
                  <p className="text-sm font-semibold text-white mb-1.5">
                    Start a conversation with {chat.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Send a message to begin chatting!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {chat.messages.map((msg) => {
                  const isCurrentUser = msg.sender_id !== chat.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3.5 py-2 ${
                          isCurrentUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#2a2a2a] text-white'
                        }`}
                      >
                        <p className="text-[15px] leading-snug break-words">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isCurrentUser ? 'text-blue-100' : 'text-gray-400'
                          }`}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {typingUsers[chat.id] && (
                  <div className="flex justify-start">
                    <div className="bg-[#2a2a2a] rounded-2xl rounded-bl-md px-3 py-2.5 flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={(el) => { messagesEndRef.current[chat.id] = el; }} />
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="p-3 bg-[#1a1a1a] border-t border-[#2a2a2a]">
            {messageErrors[chat.id] && (
              <p className="text-xs text-red-500 mb-1.5">{messageErrors[chat.id]}</p>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Send a message"
                value={messageInputs[chat.id] || ""}
                onChange={(e) => handleInputChange(chat.id, e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(chat.id)}
                className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded px-3 py-2.5 text-[15px] text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => handleSendMessage(chat.id)}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Tab Bar — hidden on /messages and auth pages */}
      {!isHidden && (
        <div className="fixed bottom-0 right-4 z-40 flex bg-[#0a0a0a] border border-[#2a2a2a] border-b-0 rounded-t-lg overflow-hidden">
          <button
            onClick={() => setActivePanel(activePanel !== null ? null : 'chat')}
            className={`relative flex items-center gap-2 px-6 py-3 text-base font-semibold transition-colors ${
              activePanel !== null ? 'bg-[#1a1a1a] text-white' : 'text-gray-400 hover:bg-[#141414]'
            }`}
          >
            <span>💬</span>
            Chat
            {totalUnread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>
        </div>
      )}
    </>
  );
}

