'use client';

import { useEffect, useState } from 'react';
import { isAuthenticated } from '@/lib/auth';
import ChatWidget from './ChatWidget';

/**
 * Global wrapper for ChatWidget that only renders when user is authenticated
 */
export default function GlobalChatWidget() {
  const [isAuth, setIsAuth] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsAuth(isAuthenticated());
  }, []);

  // Don't render on server or if not authenticated
  if (!mounted || !isAuth) {
    return null;
  }

  return <ChatWidget />;
}
