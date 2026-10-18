import { legalRoute } from "@/lib/legal-route";

const route = legalRoute("iade");

export const generateMetadata = route.generateMetadata;
export default route.Page;
