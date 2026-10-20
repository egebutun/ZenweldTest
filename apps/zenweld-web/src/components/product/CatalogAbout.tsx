import { RichText } from "@zenweld/ui";

/**
 * Grup ve kategori sayfasinin altindaki tanitim metni ("... Hakkinda").
 * Panelde Kategoriler > Tanitim Metni sekmesinden yazilir; bossa gosterilmez.
 */
export function CatalogAbout({ name, text }: { name: string; text?: string }) {
  if (!text?.trim()) return null;
  return (
    <section className="border-t border-zw-grey-200 bg-zw-grey-50">
      <div className="zw-container py-12">
        <h2 className="font-display text-3xl font-bold uppercase">{name} Hakkında</h2>
        <RichText source={text} className="mt-5 max-w-3xl" />
      </div>
    </section>
  );
}
