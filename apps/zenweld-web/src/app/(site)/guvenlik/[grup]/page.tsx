import { groupRoute } from "@/lib/section-routes";

const route = groupRoute("guvenlik");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
