import { jsonLdScript } from "@/lib/seo";

/** Sayfaya yapısal veri (schema.org JSON-LD) ekler. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }}
    />
  );
}
