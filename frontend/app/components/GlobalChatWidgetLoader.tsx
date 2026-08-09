'use client';

import dynamic from 'next/dynamic';

// next/dynamic's `ssr: false` option can only be used from a Client
// Component — app/layout.tsx must stay a Server Component (it exports
// `metadata`), so the dynamic() call lives here instead and layout.tsx
// just renders this wrapper.
const GlobalChatWidget = dynamic(() => import('./GlobalChatWidget'), { ssr: false });

export default GlobalChatWidget;
