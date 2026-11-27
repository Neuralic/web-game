'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { usePathname } from 'next/navigation';
import { useLoggedIn } from '@/lib/useLoggedIn';

// Client-only (it renders WebGL and reads localStorage), loaded from the server-component layout through this wrapper.
//
// Only signed-in users have an avatar picture to keep in sync, so the code is fetched (plain import(), not next/dynamic, which
// would list the chunk in every page's HTML) once a login exists. The pathname is read so a login followed by client-side
// navigation (no reload) is noticed.
export default function GlobalAvatarThumbnailSync() {
  usePathname();
  const loggedIn = useLoggedIn();
  const [Sync, setSync] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!loggedIn || Sync) return;
    let cancelled = false;
    import('./AvatarThumbnailSync').then((module) => {
      if (!cancelled) setSync(() => module.default);
    });
    return () => {
      cancelled = true;
    };
  }, [loggedIn, Sync]);

  return Sync ? <Sync /> : null;
}
