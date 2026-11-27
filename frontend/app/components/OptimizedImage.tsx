"use client";

import { useState, type ImgHTMLAttributes } from "react";
import { optimizeRobloxImage, type OptimizeOptions } from "@/lib/imageUrl";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet">, OptimizeOptions {
  src: string;
  /** Above the fold (the page's main image): load at once and first. Everything else is lazy-loaded. */
  priority?: boolean;
}

/**
 * <img> for thumbnails: a smaller WebP rendition when the URL is a Roblox thumbnail (see lib/imageUrl.ts), lazy-loaded and
 * decoded off the main thread unless `priority`. If the smaller rendition fails to load it quietly falls back to the original
 * URL, so a thumbnail can never end up broken because of the rewrite.
 */
export default function OptimizedImage({ src, priority = false, responsive, small, sizes, alt, onError, ...rest }: OptimizedImageProps) {
  const [original, setOriginal] = useState(false);
  const optimized = original ? null : optimizeRobloxImage(src, { responsive, small });

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={optimized?.src ?? src}
      srcSet={optimized?.srcSet}
      sizes={optimized?.srcSet ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      onError={(event) => {
        if (optimized) setOriginal(true);
        else onError?.(event);
      }}
    />
  );
}
