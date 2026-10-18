import { legalRoute } from "@/lib/legal-route";

const route = legalRoute("fiziksel-guvenlik-aydinlatma-metni");

export const generateMetadata = route.generateMetadata;
export default route.Page;
