"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Clock, Shirt, UserPlus, Users } from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import GameGridCard from "../components/GameGridCard";
import VerifiedBadge from "../components/VerifiedBadge";
import { Highlight, PersonAvatar, Thumb } from "../components/search/searchParts";
import {
  friendsApi, searchApi,
  type SiteSearchCatalogItem, type SiteSearchGame, type SiteSearchGroup, type SiteSearchPerson, type SiteSearchResult,
  type SiteSearchSection, type SiteSearchType,
} from "@/lib/api";
import { clearRecentSearches, getRecentSearches, removeRecentSearch } from "@/lib/recentSearches";

const TABS = [
  { key: "all", label: "All" },
  { key: "games", label: "Games" },
  { key: "catalog", label: "Catalog" },
  { key: "people", label: "People" },
  { key: "groups", label: "Groups" },
] as const;
type Tab = (typeof TABS)[number]["key"];
const isTab = (value: string | null): value is Tab => TABS.some((tab) => tab.key === value);

const OVERVIEW_PER_SECTION = 6;
const PAGE_SIZE = 24;

const hrefFor = (query: string, tab: Tab) => `/search?q=${encodeURIComponent(query)}${tab === "all" ? "" : `&type=${tab}`}`;

/** Items of `next` that are not in `current` yet (a page may overlap the previous one when the word filter dropped rows). */
function appendUnique<T extends { id: string }>(current: T[], next: T[]): T[] {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...next.filter((item) => !seen.has(item.id))];
}

function SearchResults() {
  const params = useSearchParams();
  const query = (params.get("q") ?? "").trim().slice(0, 64);
  const rawTab = params.get("type");
  const tab: Tab = isTab(rawTab) ? rawTab : "all";

  const [searchQuery, setSearchQuery] = useState(query);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [result, setResult] = useState<SiteSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const [friendOverride, setFriendOverride] = useState<Record<string, SiteSearchPerson["friendship_status"]>>({});

  // The header box shows what was searched (it is the page's state, because every page owns its header's text).
  useEffect(() => setSearchQuery(query), [query]);
  useEffect(() => setRecents(getRecentSearches()), []);
  useEffect(() => setResult(null), [query]);

  // One request per (text, tab). Switching tab keeps what is already on screen until the new answer arrives.
  useEffect(() => {
    setFailed(false);
    if (!query) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    searchApi
      .searchAll(query, { type: tab, limit: tab === "all" ? OVERVIEW_PER_SECTION : PAGE_SIZE, signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        setLoading(false);
        if (response.success && response.data) setResult(response.data);
        else setFailed(true);
      });
    return () => controller.abort();
  }, [query, tab]);

  const loadMore = async (type: SiteSearchType) => {
    const current = result?.[type];
    if (!current || loadingMore) return;
    setLoadingMore(true);
    const response = await searchApi.searchAll(query, { type, limit: PAGE_SIZE, offset: current.items.length });
    setLoadingMore(false);
    if (!response.success || !response.data) return;
    const next = response.data[type];
    setResult((prev) =>
      prev
        ? {
            ...prev,
            [type]: { items: appendUnique(prev[type].items as { id: string }[], next.items as { id: string }[]), hasMore: next.hasMore, approximate: prev[type].approximate },
          }
        : prev
    );
  };

  const addFriend = async (userId: string) => {
    const response = await friendsApi.sendFriendRequest(userId);
    if (response.success) setFriendOverride((prev) => ({ ...prev, [userId]: "request_sent" }));
    else alert(response.message || "Failed to send friend request");
  };

  // ── Cards ──────────────────────────────────────────────────────────────
  const gameCard = (game: SiteSearchGame) => (
    <GameGridCard
      key={game.id}
      game={{ id: game.id, title: game.title, thumbnailUrl: game.thumbnail_url || game.icon_url, visits: game.visits, placeId: game.place_id }}
    />
  );

  const catalogCard = (item: SiteSearchCatalogItem) => (
    <Link key={item.id} href={`/catalog/${item.id}`} className="block group">
      <div className="rounded-lg overflow-hidden bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <Thumb src={item.thumbnail_url} alt={item.name} className="aspect-square w-full" fallback={<Shirt className="w-10 h-10" />} />
        <div className="p-3">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-0.5 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <Highlight text={item.name} query={query} />
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">{item.creator_name || "AdventureBlox"}</p>
          {item.is_available ? (
            <p className="text-xs font-semibold text-green-600 dark:text-green-400">Free</p>
          ) : (
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Off sale</p>
          )}
        </div>
      </div>
    </Link>
  );

  const personCard = (person: SiteSearchPerson) => {
    const status = friendOverride[person.id] ?? person.friendship_status;
    return (
      <div key={person.id} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a]">
        <Link href={`/profile/${person.username}`} className="flex items-center gap-3 flex-1 min-w-0">
          <PersonAvatar person={person} size={56} />
          <span className="min-w-0">
            <span className="flex items-center gap-1 font-semibold text-gray-900 dark:text-gray-100">
              <span className="truncate"><Highlight text={person.display_name || person.username} query={query} /></span>
              {person.is_verified && <VerifiedBadge size="sm" />}
            </span>
            <span className="block truncate text-sm text-gray-500 dark:text-gray-400">@<Highlight text={person.username} query={query} /></span>
          </span>
        </Link>
        <div className="flex-shrink-0 text-xs">
          {status === "friend" ? (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><Check className="w-3.5 h-3.5" /> Friends</span>
          ) : status === "request_sent" ? (
            <span className="text-gray-500 dark:text-gray-400">Requested</span>
          ) : status === "request_received" ? (
            <Link href="/friends" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Respond</Link>
          ) : status === "none" && person.can_receive_requests === "everyone" ? (
            <button
              type="button"
              onClick={() => addFriend(person.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Friend
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  const groupCard = (group: SiteSearchGroup) => (
    <Link
      key={group.id}
      href={`/groups/${group.id}`}
      className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
    >
      <Thumb src={group.icon_url} alt={group.name} className="w-14 h-14 rounded-lg" fallback={<Users className="w-6 h-6" />} />
      <span className="min-w-0">
        <span className="flex items-center gap-1 font-semibold text-gray-900 dark:text-gray-100">
          <span className="truncate"><Highlight text={group.name} query={query} /></span>
          {group.is_verified && <VerifiedBadge size="sm" />}
        </span>
        <span className="block text-sm text-gray-500 dark:text-gray-400">{(group.member_count ?? 0).toLocaleString()} members</span>
      </span>
    </Link>
  );

  // ── Sections ───────────────────────────────────────────────────────────
  const section = <T extends { id: string }>(
    type: SiteSearchType, title: string, data: SiteSearchSection<T> | undefined, gridClass: string, render: (item: T) => ReactNode
  ) => {
    if (!data || data.items.length === 0) return null;
    const overview = tab === "all";
    return (
      <section key={type} className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          {overview && (data.hasMore || data.items.length >= OVERVIEW_PER_SECTION) && (
            <Link href={hrefFor(query, type)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">See all</Link>
          )}
        </div>
        {data.approximate && (
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">No exact matches for “{query}”. Showing similar results.</p>
        )}
        <div className={gridClass}>{data.items.map(render)}</div>
        {!overview && data.hasMore && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => loadMore(type)}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-lg bg-gray-200 dark:bg-[#242424] hover:bg-gray-300 dark:hover:bg-[#2f2f2f] text-sm font-semibold text-gray-900 dark:text-gray-100 disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </section>
    );
  };

  const GAMES_GRID = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4";
  const CATALOG_GRID = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4";
  const PEOPLE_GRID = "grid grid-cols-1 md:grid-cols-2 gap-3";
  const GROUPS_GRID = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3";

  const wanted = (type: SiteSearchType) => tab === "all" || tab === type;
  const sections = result && [
    wanted("games") && section("games", "Games", result.games, GAMES_GRID, gameCard),
    wanted("catalog") && section("catalog", "Catalog", result.catalog, CATALOG_GRID, catalogCard),
    wanted("people") && section("people", "People", result.people, PEOPLE_GRID, personCard),
    wanted("groups") && section("groups", "Groups", result.groups, GROUPS_GRID, groupCard),
  ];
  const anyResults = !!result && (["games", "catalog", "people", "groups"] as const).some((type) => wanted(type) && result[type].items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 break-words">
            {query ? <>Results for “{query}”</> : "Search"}
          </h1>

          {query && (
            <nav aria-label="Search categories" className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-800 mb-6 scrollbar-hide">
              {TABS.map((item) => (
                <Link
                  key={item.key}
                  href={hrefFor(query, item.key)}
                  aria-current={tab === item.key ? "page" : undefined}
                  className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    tab === item.key
                      ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {!query ? (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Search for games, catalog items, people and groups.</p>
              {recents.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recent searches</h2>
                    <button type="button" onClick={() => setRecents(clearRecentSearches())} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Clear all</button>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {recents.map((term) => (
                      <li key={term} className="flex items-center rounded-full bg-gray-200 dark:bg-[#242424] text-sm text-gray-900 dark:text-gray-100">
                        <Link href={hrefFor(term, "all")} className="flex items-center gap-2 pl-3 pr-2 py-1.5">
                          <Clock className="w-4 h-4 text-gray-500" />{term}
                        </Link>
                        <button type="button" aria-label={`Remove ${term}`} onClick={() => setRecents(removeRecentSearch(term))} className="pr-3 pl-1 py-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white">×</button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : failed ? (
            <p className="py-16 text-center text-gray-600 dark:text-gray-400">Search isn’t available right now. Try again in a moment.</p>
          ) : !result ? (
            <div className="flex justify-center py-20" role="status" aria-label="Searching">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : anyResults ? (
            <div className={loading ? "opacity-60 transition-opacity" : ""}>{sections}</div>
          ) : loading ? (
            <div className="flex justify-center py-20" role="status" aria-label="Searching">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="py-16 text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No results for “{query}”</h2>
              <p className="text-gray-600 dark:text-gray-400">Check the spelling or try fewer or different words.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  // useSearchParams needs a Suspense boundary for the static build.
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}
