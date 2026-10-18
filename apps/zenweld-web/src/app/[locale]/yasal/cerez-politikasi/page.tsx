import { legalRoute } from "@/lib/legal-route";

const route = legalRoute("cerez-politikasi");

export const generateMetadata = route.generateMetadata;
export default route.Page;
