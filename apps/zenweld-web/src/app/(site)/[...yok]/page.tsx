import { notFound } from "next/navigation";

/** Eslesmeyen her adres sitenin 404 sayfasina duser (ust menu ve alt bilgiyle). */
export default function UnknownPage() {
  notFound();
}
