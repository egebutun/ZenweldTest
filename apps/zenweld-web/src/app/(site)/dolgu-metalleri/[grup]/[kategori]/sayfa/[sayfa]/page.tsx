import { categoryPagedRoute } from "@/lib/section-routes";

const route = categoryPagedRoute("dolgu-metalleri");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
