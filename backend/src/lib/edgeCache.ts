// Cache-Control for public GETs, so Vercel's CDN (and the browser) can answer without waking the function and the database.
// An edge hit is ~220 ms from here vs ~400-500 ms from the origin (speed-baseline-2026-11-27.md).
//
// The rule: only a response that is IDENTICAL for every viewer may be cached for everyone.
//   cachePublic      for data that never depends on who asks (catalog lists, categories, ...).
//   cacheIfAnonymous for data that has a signed-in variant (game by id: "did I like it", catalog item: "do I own this hidden
//                    item"). Only an anonymous request's answer is cached. A request that carries an Authorization header, or
//                    that the site marked `?viewer=1` (what a signed-in browser sends, so it has its own URL and can never be
//                    answered with the cached anonymous copy), is sent `private, no-store`.
// Never call either for logged-in data, inventories, privacy-gated profiles or anything the word filter / blocks shape per
// viewer (the site search is `private`). Call them only on success paths: an error or a 404 must not be cached.

import type { Request, Response } from "express";

export function cachePublic(res: Response, sMaxAge: number, staleWhileRevalidate = sMaxAge * 2): void {
  res.set("Cache-Control", `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
}

/** True when the request belongs to a signed-in viewer (credentials, or the site's `?viewer=1` marker). */
export function isViewerRequest(req: Request): boolean {
  return !!req.headers.authorization || req.query.viewer !== undefined;
}

export function cacheIfAnonymous(req: Request, res: Response, sMaxAge: number, staleWhileRevalidate = sMaxAge * 2): void {
  if (isViewerRequest(req)) res.set("Cache-Control", "private, no-store");
  else cachePublic(res, sMaxAge, staleWhileRevalidate);
}
