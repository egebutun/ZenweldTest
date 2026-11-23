import { siteVideos } from "@zenweld/data";
import { JsonLd } from "@/components/common/JsonLd";
import { VideoLibrary } from "@/components/video/VideoLibrary";
import { breadcrumbJsonLd, SITE_NAME, videoJsonLd } from "@/lib/seo";
import { getServerCatalog } from "@/lib/server/catalog";
import { getServerContent } from "@/lib/server/content";
import { pageMetadataFor } from "@/lib/server/page-metadata";

/**
 * Videolar (/videolar; KARARLAR K-125). Baslik ve aciklama panelden (Sayfa
 * SEO). Her video Google'a VideoObject olarak bildirilir (K-123); videolar
 * sitenin iceriginden (veritabani modunda tablodan), sayfa tarayicida
 * cizilir (components/video/VideoLibrary.tsx).
 */
export const generateMetadata = pageMetadataFor("/videolar");

export default async function VideosPage() {
  const { videos } = await getServerContent();
  const { products } = await getServerCatalog();
  const items = siteVideos(videos, products);
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: SITE_NAME, path: "/" },
          { name: "Videolar", path: "/videolar" },
        ])}
      />
      {items.map(({ video, product }) => (
        <JsonLd key={video.id} data={videoJsonLd(video, product)} />
      ))}
      <VideoLibrary />
    </>
  );
}
