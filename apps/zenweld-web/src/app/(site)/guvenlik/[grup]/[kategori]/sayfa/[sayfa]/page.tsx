import { categoryPagedRoute } from "@/lib/section-routes";

const route = categoryPagedRoute("guvenlik");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
