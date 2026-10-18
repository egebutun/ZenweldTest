import { legalRoute } from "@/lib/legal-route";

const route = legalRoute("kisisel-verilerin-islenmesi-politikasi");

export const generateMetadata = route.generateMetadata;
export default route.Page;
