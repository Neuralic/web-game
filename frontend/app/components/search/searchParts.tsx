"use client";

import type { ReactNode } from "react";
import UserAvatar from "../UserAvatar";
import type { SiteSearchGame, SiteSearchPerson } from "@/lib/api";

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** `text` with the parts the user typed in bold (plain text nodes, nothing is injected as HTML). */
export function Highlight({ text, query }: { text: string; query: string }) {
  const words = Array.from(new Set(query.trim().toLowerCase().split(/\s+/).filter(Boolean)))
    .slice(0, 5)
    .sort((a, b) => b.length - a.length);
  if (words.length === 0) return <>{text}</>;
  // One capture group: split() puts the matches at the odd positions.
  const parts = text.split(new RegExp(`(${words.map(escapeRegExp).join("|")})`, "ig"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="font-bold text-gray-900 dark:text-white">{part}</span>
        ) : (
          part
        )
      )}
    </>
  );
}

/** Square thumbnail with an icon when there is no image. */
export function Thumb({ src, alt, fallback, className = "" }: { src?: string | null; alt: string; fallback: ReactNode; className?: string }) {
  return (
    <div className={`flex-shrink-0 overflow-hidden bg-gray-200 dark:bg-[#242424] flex items-center justify-center text-gray-500 ${className}`}>
      {src ? <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" /> : fallback}
    </div>
  );
}

/** Our own head image when the search returned one, otherwise the shared avatar (which fetches and caches the render). */
export function PersonAvatar({ person, size }: { person: SiteSearchPerson; size: number }) {
  const name = person.display_name || person.username;
  if (person.head_url) {
    return (
      <div style={{ width: size, height: size }} className="rounded-full overflow-hidden bg-gray-200 dark:bg-[#242424] flex-shrink-0">
        <img src={person.head_url} alt={name} loading="lazy" className="w-full h-full object-cover" />
      </div>
    );
  }
  return <UserAvatar userId={person.id} username={name} size={size} headshot />;
}

export const likePercent = (game: Pick<SiteSearchGame, "likes" | "dislikes">): number | null => {
  const likes = game.likes ?? 0;
  const total = likes + (game.dislikes ?? 0);
  return total > 0 ? Math.round((likes / total) * 100) : null;
};

/** "1,234 playing · 92% liked" (or visits when nobody is playing). */
export function gameSubtitle(game: SiteSearchGame): string {
  const playing = game.current_players ?? 0;
  const pct = likePercent(game);
  const base = playing > 0 ? `${playing.toLocaleString()} playing` : `${(game.visits ?? 0).toLocaleString()} visits`;
  return pct === null ? base : `${base} · ${pct}% liked`;
}
