'use client';

import dynamic from 'next/dynamic';

// Client-only (it renders WebGL and reads localStorage), loaded from the server-component layout through this wrapper.
const AvatarThumbnailSync = dynamic(() => import('./AvatarThumbnailSync'), { ssr: false });

export default AvatarThumbnailSync;
