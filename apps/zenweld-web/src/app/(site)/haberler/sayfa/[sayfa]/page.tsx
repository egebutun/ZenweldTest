import { POSTS_PER_PAGE } from "@zenweld/data";
import { NewsList } from "@/components/events/NewsList";
import { getServerContent } from "@/lib/server/content";
import { pageMetadataFor } from "@/lib/server/page-metadata";
import { pagedRoute } from "@/lib/server/paged-route";

/** /haberler/sayfa/<n>: listenin 2. ve sonraki sayfalari (KARARLAR K-124). */
const count = async () => (await getServerContent()).news.filter((n) => n.active).length;

const route = pagedRoute<{ sayfa: string }>({
  basePath: () => "/haberler",
  perPage: POSTS_PER_PAGE,
  count,
  metadata: () => pageMetadataFor("/haberler")(),
  staticParams: async () => [{ params: {}, count: await count() }],
  render: (_, page) => <NewsList page={page} />,
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
