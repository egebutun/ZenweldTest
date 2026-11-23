"use client";

import type { SiteVideo } from "@zenweld/data";
import { videoPoster, youtubeEmbed } from "@zenweld/data";

/**
 * VIDEO OYNATICI (KARARLAR K-125; docs/IS-KURALLARI.md › 27)
 *
 * Ziyaretci Oynat'a basinca yerine konur ve hemen oynar:
 * - YouTube videosu: YouTube'un cerezsiz oynaticisi (youtube-nocookie.com).
 * - Kendi videomuz: tarayicinin kendi oynaticisi; genis ekrana (768 px ve
 *   ustu) 1080p, telefona 720p surum gider. Video dosya deposundan parca
 *   parca iner (ileri sarma, iPhone).
 */
export function VideoPlayer({ video, title, className = "" }: { video: SiteVideo; title: string; className?: string }) {
  if (video.source === "youtube") {
    return (
      <iframe
        src={youtubeEmbed(video.youtubeId ?? "")}
        title={title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className={className}
      />
    );
  }
  const wide = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
  const src = (wide ? video.file?.hd : video.file?.sd) ?? video.file?.hd;
  return (
    <video
      src={src}
      poster={videoPoster(video)}
      title={title}
      controls
      autoPlay
      playsInline
      preload="metadata"
      className={`bg-black object-contain ${className}`}
    />
  );
}
