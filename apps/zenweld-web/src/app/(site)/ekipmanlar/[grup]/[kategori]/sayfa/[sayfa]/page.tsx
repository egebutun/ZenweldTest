import { categoryPagedRoute } from "@/lib/section-routes";

const route = categoryPagedRoute("ekipmanlar");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
