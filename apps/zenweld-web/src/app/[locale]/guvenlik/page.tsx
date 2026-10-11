import { sectionRoute } from "@/lib/section-routes";

const route = sectionRoute("guvenlik");

export const generateMetadata = route.generateMetadata;
export default route.Page;
