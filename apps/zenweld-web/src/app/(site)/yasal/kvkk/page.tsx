import { legalRoute } from "@/lib/legal-route";

const route = legalRoute("kvkk");

export const generateMetadata = route.generateMetadata;
export default route.Page;
