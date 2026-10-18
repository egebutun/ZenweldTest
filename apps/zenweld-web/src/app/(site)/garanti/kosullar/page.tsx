import { legalRoute } from "@/lib/legal-route";

const route = legalRoute("garanti-kosullari");

export const generateMetadata = route.generateMetadata;
export default route.Page;
