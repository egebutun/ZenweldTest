import { legalRoute } from "@/lib/legal-route";

const route = legalRoute("on-bilgilendirme-formu");

export const generateMetadata = route.generateMetadata;
export default route.Page;
