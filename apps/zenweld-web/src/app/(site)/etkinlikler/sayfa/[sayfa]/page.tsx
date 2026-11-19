import { POSTS_PER_PAGE } from "@zenweld/data";
import { EventList } from "@/components/events/EventList";
import { getServerContent } from "@/lib/server/content";
import { pageMetadataFor } from "@/lib/server/page-metadata";
import { pagedRoute } from "@/lib/server/paged-route";

/** /etkinlikler/sayfa/<n>: listenin 2. ve sonraki sayfalari (KARARLAR K-124). */
const count = async () => (await getServerContent()).events.filter((e) => e.active).length;

const route = pagedRoute<{ sayfa: string }>({
  basePath: () => "/etkinlikler",
  perPage: POSTS_PER_PAGE,
  count,
  metadata: () => pageMetadataFor("/etkinlikler")(),
  staticParams: async () => [{ params: {}, count: await count() }],
  render: (_, page) => <EventList page={page} />,
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
