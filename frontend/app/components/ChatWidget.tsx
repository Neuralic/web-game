'use client';

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import UserAvatar from "./UserAvatar";
import { MessageSquare, X, Send } from "lucide-react";
import { usePathname } from "next/navigation";
import { messagesApi, friendsApi } from "@/lib/api";
import { sendChatMessage, subscribeToMessages, unsubscribeFromMessages, markMessagesAsRead, subscribeToTyping, unsubscribeFromTyping, broadcastTyping } from "@/lib/realtime";
import { supabase } from "@/lib/supabase";
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
  unread_count?: number;
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
      if (!openChats.find(chat => chat.id === userId)) {
        const newChat: ChatWindow = {
          id: userId,
          name: displayName || username,
          avatar: avatarUrl || `https://robohash.org/${username}?set=set3`,
          username: `@${username}`,
          messages: [],
          isLoadingMessages: false,
        };
        setOpenChats(prev => [...prev, newChat]);
        loadMessages(userId);
      }
      setActivePanel(null);
    };

    return () => {
      globalOpenChat = null;
    };
  }, [openChats]);

  // Load friends and conversations on mount
  useEffect(() => {
    loadFriends();
    loadConversations();
  }, []);

  // Global incoming-message listener — keeps unread counts and conversation
  // list up-to-date WITHOUT a full API re-fetch every time
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    let userId: string;
    try {
      userId = JSON.parse(atob(token.split('.')[1])).userId;
    } catch {
      return;
    }

    const channel = supabase
      .channel(`chat-widget-incoming:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiverId=eq.${userId}`,
        },
        (event: any) => {
          const msg = event.new;
          const senderId: string = msg.senderId;

          // If the sender's chat window is already open, the per-chat
          // subscribeToMessages handler adds the bubble — just mark read
          const isOpen = openChatsRef.current.some(c => c.id === senderId);

          // Always update the conversations list in-memory
          setConversations(prev => {
            const existing = prev.find(c => c.id === senderId);
            if (existing) {
              return prev.map(c =>
                c.id === senderId
                  ? {
                      ...c,
                      last_message: msg.content,
                      last_message_time: msg.createdAt,
                      unread_count: isOpen ? 0 : (c.unread_count || 0) + 1,
                    }
                  : c
              ).sort((a, b) =>
                new Date(b.last_message_time || 0).getTime() -
                new Date(a.last_message_time || 0).getTime()
              );
            }
            // New conversation — fetch to get user info
            loadConversations();
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Subscribe to messages + typing for open chats
  useEffect(() => {
    const userId = currentUserIdRef.current;
    if (!userId) return;

    openChats.forEach(chat => {
      subscribeToMessages(userId, chat.id, (message: ChatMessage) => {
        setOpenChats(prev => prev.map(c =>
          c.id === chat.id ? { ...c, messages: [...c.messages.filter(m => m.id !== message.id), message] } : c
        ));
        // Update conversation preview in-memory, clear unread since window is open
        setConversations(prev => prev.map(c =>
          c.id === chat.id
            ? { ...c, last_message: message.content, last_message_time: message.created_at, unread_count: 0 }
            : c
        ));
        markMessagesAsRead(message.sender_id);
        // Scroll to bottom
        setTimeout(() => {
          const el = messagesEndRef.current[chat.id];
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
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
  }, [openChats.map(c => c.id).join(',')]);

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

      // Mark as read
      markMessagesAsRead(userId);
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

  const openChatWindow = (conv: Conversation) => {
    if (!openChats.find(chat => chat.id === conv.id)) {
      const newChat: ChatWindow = {
        id: conv.id,
        name: conv.display_name || conv.username,
        avatar: conv.avatar_url || `https://robohash.org/${conv.username}?set=set3`,
        username: `@${conv.username}`,
        messages: [],
        isLoadingMessages: false,
      };
      setOpenChats([...openChats, newChat]);
      loadMessages(conv.id);
    }
    // Clear unread badge immediately
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
    markMessagesAsRead(conv.id);
    setActivePanel(null);
  };

  const openChatWindowFromFriend = (friend: Friend) => {
    if (!openChats.find(chat => chat.id === friend.id)) {
      const newChat: ChatWindow = {
        id: friend.id,
        name: friend.display_name || friend.username,
        avatar: friend.avatar_url || `https://robohash.org/${friend.username}?set=set3`,
        username: `@${friend.username}`,
        messages: [],
        isLoadingMessages: false,
      };
      setOpenChats([...openChats, newChat]);
      loadMessages(friend.id);
    }
    setActivePanel(null);
  };

  const closeChatWindow = (chatId: string) => {
    setOpenChats(openChats.filter(chat => chat.id !== chatId));
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

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const CHAT_WINDOW_WIDTH = 256; // w-64
  const GAP = 16;
  const PANEL_COLUMN = 16 + CHAT_WINDOW_WIDTH + GAP; // right-4 + panel width + gap

  return (
    <>
      {/* Chat List Panel */}
      {activePanel === 'chat' && (
        <div className="fixed bottom-11 right-4 w-64 max-h-96 bg-[#1a1a1a] rounded-t-lg shadow-2xl border border-[#2a2a2a] flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-[#1a1a1a] border-b border-[#2a2a2a] rounded-t-lg">
            <h3 className="font-bold text-white text-sm">Chat</h3>
            <button
              onClick={() => setActivePanel(null)}
              className="p-1 hover:bg-[#2a2a2a] rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

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
                      {isConversation && (contact.unread_count || 0) > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                          {contact.unread_count}
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
        </div>
      )}

      {/* Party Panel */}
      {activePanel === 'party' && (
        <div className="fixed bottom-11 right-4 w-64 max-h-96 bg-[#1a1a1a] rounded-t-lg shadow-2xl border border-[#2a2a2a] flex flex-col z-50">
          <div className="flex items-center justify-between px-3 py-2.5 bg-[#1a1a1a] border-b border-[#2a2a2a] rounded-t-lg">
            <h3 className="font-bold text-white text-sm">Party</h3>
            <button
              onClick={() => setActivePanel(null)}
              className="p-1 hover:bg-[#2a2a2a] rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <span className="text-3xl mb-3">🎮</span>
            <p className="text-sm text-gray-400">Party feature coming soon</p>
          </div>
        </div>
      )}

      {/* Individual Chat Windows — stack left starting past the panel column */}
      {openChats.map((chat, index) => (
        <div
          key={chat.id}
          className="fixed bottom-11 w-64 h-96 bg-[#1a1a1a] rounded-t-lg shadow-2xl border border-[#2a2a2a] flex flex-col z-50"
          style={{ right: `${PANEL_COLUMN + index * (CHAT_WINDOW_WIDTH + GAP)}px` }}
        >
          {/* Chat Header */}
          <div className="flex items-center gap-2.5 px-3 py-2 bg-[#1a1a1a] border-b border-[#2a2a2a] rounded-t-lg">
            <UserAvatar userId={chat.id} username={chat.displayName || chat.name} size={28} headshot />
            <h3 className="flex-1 font-bold text-sm text-white truncate">
              {chat.name}
            </h3>
            <button
              onClick={() => closeChatWindow(chat.id)}
              className="p-1 hover:bg-[#2a2a2a] rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#0a0a0a]">
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
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          isCurrentUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#2a2a2a] text-white'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
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
          <div className="p-2.5 bg-[#1a1a1a] border-t border-[#2a2a2a]">
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
                className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => handleSendMessage(chat.id)}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
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
            onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activePanel === 'chat' ? 'bg-[#1a1a1a] text-white' : 'text-gray-400 hover:bg-[#141414]'
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
          <div className="w-px bg-[#2a2a2a]" />
          <button
            onClick={() => setActivePanel(activePanel === 'party' ? null : 'party')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activePanel === 'party' ? 'bg-[#1a1a1a] text-white' : 'text-gray-400 hover:bg-[#141414]'
            }`}
          >
            <span>🎮</span>
            Party
          </button>
        </div>
      )}
    </>
  );
}

