import { legalRoute } from "@/lib/legal-route";

const route = legalRoute("mesafeli-satis-sozlesmesi");

export const generateMetadata = route.generateMetadata;
export default route.Page;
