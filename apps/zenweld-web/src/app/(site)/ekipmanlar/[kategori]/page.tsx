import { categoryRoute } from "@/lib/section-routes";

const route = categoryRoute("ekipmanlar");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
