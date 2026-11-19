import { POSTS_PER_PAGE } from "@zenweld/data";
import { BlogList } from "@/components/events/BlogList";
import { getServerContent } from "@/lib/server/content";
import { pageMetadataFor } from "@/lib/server/page-metadata";
import { pagedRoute } from "@/lib/server/paged-route";

/** /blog/sayfa/<n>: listenin 2. ve sonraki sayfalari (KARARLAR K-124). */
const count = async () => (await getServerContent()).blogPosts.filter((p) => p.active !== false).length;

const route = pagedRoute<{ sayfa: string }>({
  basePath: () => "/blog",
  perPage: POSTS_PER_PAGE,
  count,
  metadata: () => pageMetadataFor("/blog")(),
  staticParams: async () => [{ params: {}, count: await count() }],
  render: (_, page) => <BlogList page={page} />,
});

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
