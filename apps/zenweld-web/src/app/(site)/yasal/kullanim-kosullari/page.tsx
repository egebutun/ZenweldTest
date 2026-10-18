import { legalRoute } from "@/lib/legal-route";

const route = legalRoute("kullanim-kosullari");

export const generateMetadata = route.generateMetadata;
export default route.Page;
