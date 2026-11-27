// Smaller versions of the Roblox thumbnails we show. The stored URLs point at Roblox's PNG renditions (a 768x432 game
// thumbnail is ~400 KB, a 420x420 catalog thumbnail ~50 KB). The same hash is served as WebP at the same pixel size
// (~70 KB and ~8 KB), and a game thumbnail also at 384x216 (~27 KB) or 256x144 (~14 KB).
//
// Only tr.rbxcdn.com thumbnail URLs of the exact stored shape are rewritten; anything else (Supabase storage, uploads, URLs of
// another shape) is returned untouched. OptimizedImage falls back to the original URL if a rewritten one ever fails to load.

const ROBLOX_THUMB = /^(https:\/\/tr\.rbxcdn\.com\/[0-9A-Za-z-]+)\/(\d+)\/(\d+)\/([A-Za-z]+)\/Png\/(\w+)$/;

export interface ImageSource {
  src: string;
  /** Width-descriptor list for responsive loading (use together with `sizes`). */
  srcSet?: string;
}

export interface OptimizeOptions {
  /** Game thumbnails (16:9): offer 384 and 768 wide so 1x screens download the small one and retina screens the large one. */
  responsive?: boolean;
  /** Tiny slots (search suggestions, icons): the smallest rendition is plenty. */
  small?: boolean;
}

/** The optimised rendition(s) of a Roblox thumbnail URL, or null when the URL is not one we know how to shrink. */
export function optimizeRobloxImage(url: string | null | undefined, options: OptimizeOptions = {}): ImageSource | null {
  if (!url) return null;
  const match = ROBLOX_THUMB.exec(url);
  if (!match) return null;
  const [, base, w, h, kind, filter] = match;
  const webp = `${base}/${w}/${h}/${kind}/Webp/${filter}`;

  if (kind === "Image" && w === "768" && h === "432") {
    const medium = `${base}/384/216/Image/Webp/${filter}`;
    if (options.small) return { src: `${base}/256/144/Image/Webp/${filter}` };
    if (options.responsive) return { src: medium, srcSet: `${medium} 384w, ${webp} 768w` };
  }
  return { src: webp };
}
