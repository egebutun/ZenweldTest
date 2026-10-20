import { groupRoute } from "@/lib/section-routes";

const route = groupRoute("dolgu-metalleri");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
