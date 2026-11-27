"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { ArrowLeft, Clock, Gamepad2, Search, Shirt, Users, X } from "lucide-react";
import VerifiedBadge from "../VerifiedBadge";
import { searchApi, type SiteSearchResult } from "@/lib/api";
import { addRecentSearch, clearRecentSearches, getRecentSearches, removeRecentSearch } from "@/lib/recentSearches";
import { Highlight, PersonAvatar, Thumb, gameSubtitle } from "./searchParts";

const DEBOUNCE_MS = 180;
const SUGGESTIONS_PER_SECTION = 4;
const CACHE_TTL_MS = 30_000;
const CACHE_MAX = 40;

// Answers already fetched in this tab: backspacing or retyping a text is instant and costs no request.
const cache = new Map<string, { at: number; data: SiteSearchResult }>();
const cacheKey = (query: string) => query.toLowerCase();

function cached(query: string): SiteSearchResult | null {
  const hit = cache.get(cacheKey(query));
  return hit && Date.now() - hit.at < CACHE_TTL_MS ? hit.data : null;
}

function remember(query: string, data: SiteSearchResult) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
  cache.set(cacheKey(query), { at: Date.now(), data });
}

interface Option {
  /** Stable key, also used to number the options for the keyboard. */
  id: string;
  href: string;
  /** Result options: remember what was typed and clear the box. Recent / "see all" options keep the text. */
  clearsText: boolean;
  content: ReactNode;
  /** Recent searches only: what it removes. */
  recent?: string;
}

interface Group {
  key: string;
  title: string;
  seeAllHref?: string;
  options: Option[];
}

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  /** "overlay" is the full-screen phone version. */
  variant?: "inline" | "overlay";
  onClose?: () => void;
}

const resultsHref = (query: string, type?: string) =>
  `/search?q=${encodeURIComponent(query)}${type ? `&type=${type}` : ""}`;

export default function SearchBox({ value, onChange, variant = "inline", onClose }: SearchBoxProps) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlay = variant === "overlay";

  const [open, setOpen] = useState(overlay);
  const [data, setData] = useState<SiteSearchResult | null>(null);
  const [loadingFlag, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);
  // The overlay only mounts in the browser, so it can read storage right away; the dropdown reads it on focus.
  const [recents, setRecents] = useState<string[]>(() => (overlay ? getRecentSearches() : []));

  const query = value.trim();
  // An emptied box is never "loading", whatever the cancelled request left behind.
  const loading = loadingFlag && query !== "";

  // The phone overlay opens straight into typing and keeps the page behind it from scrolling.
  useEffect(() => {
    if (!overlay) return;
    inputRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [overlay]);

  // Fetch suggestions: debounced, one request for every section, the previous one cancelled, repeats served from the cache.
  useEffect(() => {
    if (!open || !query) return;
    const controller = new AbortController();
    const hit = cached(query);
    // All state updates happen in the callback (a cache hit answers on the next tick, a miss after the debounce).
    const timer = setTimeout(async () => {
      setFailed(false);
      if (hit) {
        setActive(-1);
        setData(hit);
        setLoading(false);
        return;
      }
      setLoading(true);
      const response = await searchApi.searchAll(query, { limit: SUGGESTIONS_PER_SECTION, signal: controller.signal });
      if (controller.signal.aborted) return;
      setLoading(false);
      if (response.success && response.data) {
        remember(query, response.data);
        setActive(-1);
        setData(response.data);
      } else {
        setData(null);
        setFailed(true);
      }
    }, hit ? 0 : DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  // Click outside closes the dropdown (the overlay is closed by its own button).
  useEffect(() => {
    if (overlay) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [overlay]);

  const closePanel = () => {
    setActive(-1);
    if (overlay) onClose?.();
    else {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // ── What the panel shows ───────────────────────────────────────────────
  const groups: Group[] = useMemo(() => {
    if (!query) {
      if (recents.length === 0) return [];
      return [{
        key: "recent",
        title: "Recent searches",
        options: recents.map((term) => ({
          id: `recent:${term}`,
          href: resultsHref(term),
          clearsText: false,
          recent: term,
          content: (
            <>
              <span className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-gray-400"><Clock className="w-5 h-5" /></span>
              <span className="truncate text-sm text-gray-900 dark:text-gray-100">{term}</span>
            </>
          ),
        })),
      }];
    }
    if (!data) return [];
    const result: Group[] = [];
    if (data.games.items.length > 0) {
      result.push({
        key: "games", title: "Games", seeAllHref: resultsHref(query, "games"),
        options: data.games.items.map((game) => ({
          id: `game:${game.id}`, href: `/games/${game.id}`, clearsText: true,
          content: (
            <>
              <Thumb src={game.thumbnail_url || game.icon_url} alt="" className="w-10 h-10 rounded-md" fallback={<Gamepad2 className="w-5 h-5" />} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-700 dark:text-gray-300"><Highlight text={game.title} query={query} /></span>
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{gameSubtitle(game)}</span>
              </span>
            </>
          ),
        })),
      });
    }
    if (data.catalog.items.length > 0) {
      result.push({
        key: "catalog", title: "Catalog", seeAllHref: resultsHref(query, "catalog"),
        options: data.catalog.items.map((item) => ({
          id: `catalog:${item.id}`, href: `/catalog/${item.id}`, clearsText: true,
          content: (
            <>
              <Thumb src={item.thumbnail_url} alt="" className="w-10 h-10 rounded-md" fallback={<Shirt className="w-5 h-5" />} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-700 dark:text-gray-300"><Highlight text={item.name} query={query} /></span>
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                  {[item.creator_name || "AdventureBlox", item.category].filter(Boolean).join(" · ")}
                </span>
              </span>
            </>
          ),
        })),
      });
    }
    if (data.people.items.length > 0) {
      result.push({
        key: "people", title: "People", seeAllHref: resultsHref(query, "people"),
        options: data.people.items.map((person) => ({
          id: `person:${person.id}`, href: `/profile/${person.username}`, clearsText: true,
          content: (
            <>
              <PersonAvatar person={person} size={40} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <span className="truncate"><Highlight text={person.display_name || person.username} query={query} /></span>
                  {person.is_verified && <VerifiedBadge size="sm" />}
                </span>
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                  @<Highlight text={person.username} query={query} />
                </span>
              </span>
              {person.friendship_status === "friend" && (
                <span className="text-xs text-green-600 dark:text-green-400 flex-shrink-0">Friend</span>
              )}
            </>
          ),
        })),
      });
    }
    if (data.groups.items.length > 0) {
      result.push({
        key: "groups", title: "Groups", seeAllHref: resultsHref(query, "groups"),
        options: data.groups.items.map((group) => ({
          id: `group:${group.id}`, href: `/groups/${group.id}`, clearsText: true,
          content: (
            <>
              <Thumb src={group.icon_url} alt="" className="w-10 h-10 rounded-md" fallback={<Users className="w-5 h-5" />} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <span className="truncate"><Highlight text={group.name} query={query} /></span>
                  {group.is_verified && <VerifiedBadge size="sm" />}
                </span>
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{(group.member_count ?? 0).toLocaleString()} members</span>
              </span>
            </>
          ),
        })),
      });
    }
    return result;
  }, [query, data, recents]);

  const hasResults = groups.length > 0;
  // Last option: "see all results" for what is typed. Enter with nothing highlighted does the same.
  const allOption: Option | null = query
    ? {
        id: "all", href: resultsHref(query), clearsText: false,
        content: (
          <>
            <span className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-blue-600 dark:text-blue-400"><Search className="w-5 h-5" /></span>
            <span className="truncate text-sm text-blue-600 dark:text-blue-400 font-semibold">See all results for “{query}”</span>
          </>
        ),
      }
    : null;
  const flat: Option[] = [...groups.flatMap((g) => g.options), ...(allOption ? [allOption] : [])];
  const indexOf = new Map(flat.map((option, i) => [option.id, i]));

  // The phone overlay always has a body (a hint when there is nothing to list); the dropdown only opens when it has content.
  const showPanel = open && (query ? true : recents.length > 0 || overlay);
  const showHint = !query && recents.length === 0;
  const approximate = !!data && !loading && query !== "" && (data.games.approximate || data.catalog.approximate || data.people.approximate || data.groups.approximate);
  const nothingFound = query !== "" && !loading && !failed && data !== null && !hasResults;
  const optionId = (i: number) => `${listId}-option-${i}`;

  // ── Actions ────────────────────────────────────────────────────────────
  const submit = (term: string) => {
    const text = term.trim();
    if (!text) return;
    addRecentSearch(text);
    closePanel();
    router.push(resultsHref(text));
  };

  const choose = (option: Option) => {
    if (option.clearsText) {
      if (query) addRecentSearch(query);
      onChange("");
    } else if (option.recent) {
      onChange(option.recent);
      addRecentSearch(option.recent);
    } else if (query) {
      addRecentSearch(query);
    }
    closePanel();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      if (flat.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (current === -1 ? (step === 1 ? 0 : flat.length - 1) : (current + step + flat.length) % flat.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = active >= 0 ? flat[active] : undefined;
      if (option && option.id !== "all") {
        choose(option);
        router.push(option.href);
      } else {
        submit(option?.recent ?? query);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (open && !overlay) {
        setOpen(false);
        setActive(-1);
      } else if (overlay) onClose?.();
      else if (query) onChange("");
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const renderOption = (option: Option) => {
    const index = indexOf.get(option.id) ?? -1;
    const selected = index === active;
    return (
      <div
        key={option.id}
        id={optionId(index)}
        role="option"
        aria-selected={selected}
        onMouseEnter={() => setActive(index)}
        className={`flex items-center ${selected ? "bg-gray-100 dark:bg-[#2a2a2a]" : "hover:bg-gray-50 dark:hover:bg-[#242424]"}`}
      >
        <Link
          href={option.href}
          tabIndex={-1}
          // Keep the focus in the box so the dropdown does not close before the click lands.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => choose(option)}
          className="flex flex-1 min-w-0 items-center gap-3 px-3 py-2 min-h-[52px]"
        >
          {option.content}
        </Link>
        {option.recent && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={`Remove ${option.recent} from recent searches`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setRecents(removeRecentSearch(option.recent as string))}
            className="mr-2 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  const panel = showPanel && (
    <div
      className={
        overlay
          ? "flex-1 overflow-y-auto bg-white dark:bg-black"
          : "absolute left-0 top-full mt-2 w-[min(32rem,calc(100vw-1rem))] max-h-[min(70vh,34rem)] overflow-y-auto rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] shadow-xl z-50"
      }
    >
      <div role="status" aria-live="polite" className="sr-only">
        {query && !loading && data ? (hasResults ? "Suggestions available. Use the arrow keys." : "No results") : ""}
      </div>
      {loading && <div className="h-0.5 w-full overflow-hidden bg-blue-100 dark:bg-blue-950"><div className="h-full w-1/3 bg-blue-600 animate-pulse" /></div>}

      <div id={listId} role="listbox" aria-label={query ? "Search suggestions" : "Recent searches"}>
        {groups.map((group) => (
          <div key={group.key} className={loading && query ? "opacity-60" : ""}>
            <div role="presentation" className="flex items-center justify-between px-3 pt-3 pb-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{group.title}</span>
              {group.seeAllHref ? (
                <Link href={group.seeAllHref} onClick={() => { if (query) addRecentSearch(query); closePanel(); }} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  See all
                </Link>
              ) : (
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setRecents(clearRecentSearches())} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  Clear all
                </button>
              )}
            </div>
            {group.options.map(renderOption)}
          </div>
        ))}
        {allOption && hasResults && <div className="border-t border-gray-200 dark:border-[#2a2a2a] mt-1">{renderOption(allOption)}</div>}
      </div>

      {approximate && (
        <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">No exact matches for “{query}”. Showing similar results.</p>
      )}
      {loading && !hasResults && (
        <div className="p-3 space-y-3" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-[#2a2a2a]" />
              <div className="flex-1 space-y-2"><div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-[#2a2a2a]" /><div className="h-2.5 w-1/3 rounded bg-gray-200 dark:bg-[#2a2a2a]" /></div>
            </div>
          ))}
        </div>
      )}
      {showHint && (
        <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Search for games, catalog items, people and groups.</p>
      )}
      {nothingFound && (
        <div className="px-4 py-6 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">No results for “{query}”</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Check the spelling or try fewer words.</p>
        </div>
      )}
      {failed && !loading && (
        <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Search isn’t available right now. Try again in a moment.</p>
      )}
    </div>
  );

  const field = (
    <div
      className={`flex items-center gap-2 bg-gray-100 dark:bg-[#1a1a1a] ${
        overlay ? "flex-1 rounded-full px-4 py-2.5" : "rounded-full px-4 py-2 w-full max-w-[500px] focus-within:ring-1 focus-within:ring-blue-500"
      }`}
    >
      <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label="Search"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? optionId(active) : undefined}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="search"
        maxLength={64}
        placeholder="Search"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onFocus={() => {
          setRecents(getRecentSearches());
          setOpen(true);
        }}
        // A click on the already-focused box (after Escape) opens it again; onFocus does not fire then.
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm focus:outline-none w-full min-w-0"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="p-0.5 rounded-full text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  if (overlay) {
    // In a portal: the header is its own stacking context, which would keep the overlay under other fixed layers.
    return createPortal(
      <div ref={rootRef} role="search" className="fixed inset-0 z-[110] flex flex-col bg-white dark:bg-black">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-200 dark:border-gray-800">
          <button type="button" aria-label="Close search" onClick={() => onClose?.()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {field}
        </div>
        {panel}
      </div>,
      document.body
    );
  }

  return (
    <div ref={rootRef} role="search" className="relative flex items-center gap-2 flex-1 min-w-0">
      {field}
      {panel}
    </div>
  );
}
