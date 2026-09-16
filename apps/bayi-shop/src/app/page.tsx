import { redirect } from "next/navigation";
import { defaultLocale } from "@zenweld/i18n";

export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
