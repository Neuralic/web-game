'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { useLoggedIn } from '@/lib/useLoggedIn';

// app/layout.tsx must stay a Server Component (it exports `metadata`), so the client-side loading lives in this wrapper.
//
// The chat widget (and the realtime/Supabase code it brings, ~50 KB gzipped) is only for signed-in users. It is loaded with a
// plain import() once a login exists, not with next/dynamic: next/dynamic still lists the chunk in the page's HTML, so it was
// downloaded by every logged-out visitor even though nothing rendered it.
export default function GlobalChatWidgetLoader() {
  const loggedIn = useLoggedIn();
  const [Widget, setWidget] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!loggedIn || Widget) return;
    let cancelled = false;
    import('./GlobalChatWidget').then((module) => {
      if (!cancelled) setWidget(() => module.default);
    });
    return () => {
      cancelled = true;
    };
  }, [loggedIn, Widget]);

  return Widget ? <Widget /> : null;
}
