import { legalRoute } from "@/lib/legal-route";

const route = legalRoute("kisisel-veri-saklama-ve-imha-politikasi");

export const generateMetadata = route.generateMetadata;
export default route.Page;
