import { groupRoute } from "@/lib/section-routes";

const route = groupRoute("ekipmanlar");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
