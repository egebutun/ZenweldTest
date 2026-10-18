import { sectionRoute } from "@/lib/section-routes";

const route = sectionRoute("aksesuarlar");

export const generateMetadata = route.generateMetadata;
export default route.Page;
