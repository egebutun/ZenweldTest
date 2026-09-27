"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import type { Product, WeldingProcess } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { Button } from "@zenweld/ui";
import { PageHero } from "@/components/common/PageShell";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useT } from "@/lib/i18n-client";

type Step = 0 | 1 | 2 | 3;

const MATERIALS = [
  { id: "celik", label: "Çelik / Karbon Çeliği", processes: ["MIG", "MAG", "MMA"] },
  { id: "paslanmaz", label: "Paslanmaz Çelik", processes: ["TIG", "MIG", "PULSE"] },
  { id: "aluminyum", label: "Alüminyum", processes: ["TIG", "PULSE", "MIG"] },
  { id: "kesim", label: "Kesim yapacağım", processes: ["PLAZMA"] },
] as const;

const USAGES = [
  { id: "hobi", label: "Hobi / Ev", max: 15_000 },
  { id: "atolye", label: "Küçük Atölye", max: 50_000 },
  { id: "sanayi", label: "Sanayi / Seri Üretim", max: Infinity },
] as const;

const POWERS = [
  { id: "mono", label: "220V Monofaze" },
  { id: "tri", label: "380V Trifaze" },
  { id: "farketmez", label: "Farketmez" },
] as const;

/** Urun 3 faz mi istiyor? */
const isThreePhase = (p: Product) => p.specs.some((s) => s.value.tr.includes("3 faz"));

/**
 * Anasayfadaki serit "?malzeme=celik" gibi bir on secimle gelebilir.
 * useSearchParams statik on-uretimde Suspense siniri gerektirir.
 */
export default function ProductSelectorPage() {
  return (
    <Suspense fallback={<ProductSelector />}>
      <ProductSelectorWithParam />
    </Suspense>
  );
}

function ProductSelectorWithParam() {
  const preset = useSearchParams().get("malzeme") ?? "";
  return <ProductSelector preset={preset} />;
}

function ProductSelector({ preset = "" }: { preset?: string }) {
  const t = useT();
  const db = useDatabase();

  // Her adimda birden fazla secenek isaretlenebilir.
  const [materials, setMaterials] = useState<string[]>(
    preset && MATERIALS.some((m) => m.id === preset) ? [preset] : [],
  );
  const [usages, setUsages] = useState<string[]>([]);
  const [powers, setPowers] = useState<string[]>([]);
  const [step, setStep] = useState<Step>(materials.length > 0 ? 1 : 0);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const results = useMemo(() => {
    if (materials.length === 0) return [];

    // Secilen malzemelerin gerektirdigi kaynak yontemlerinin birlesimi.
    const wanted = new Set<string>(
      MATERIALS.filter((m) => materials.includes(m.id)).flatMap((m) => [...m.processes]),
    );

    // Birden fazla kullanim seciliyse en genis butce gecerli olur.
    const budget = usages.length
      ? Math.max(...USAGES.filter((u) => usages.includes(u.id)).map((u) => u.max))
      : Infinity;

    // Secilen altyapilardan HERHANGI biri urune uyuyorsa yeterli.
    const powerFits = (p: Product) => {
      if (powers.length === 0 || powers.includes("farketmez")) return true;
      return powers.some((id) =>
        id === "mono" ? !isThreePhase(p) : id === "tri" ? isThreePhase(p) : true,
      );
    };

    return db.products.filter((p) => {
      if (!p.active || p.section !== "ekipmanlar") return false;
      if (!p.processes.some((proc) => wanted.has(proc as WeldingProcess))) return false;
      if (p.priceExVat > budget) return false;
      return powerFits(p);
    });
  }, [db, materials, usages, powers]);

  const steps = [
    {
      title: "Hangi malzemeleri kaynatacaksınız?",
      items: MATERIALS,
      value: materials,
      set: setMaterials,
    },
    { title: "Kullanım amacınız nedir?", items: USAGES, value: usages, set: setUsages },
    { title: "Elektrik altyapınız?", items: POWERS, value: powers, set: setPowers },
  ] as const;

  const current = steps[step as 0 | 1 | 2];

  const reset = () => {
    setStep(0);
    setMaterials([]);
    setUsages([]);
    setPowers([]);
  };

  return (
    <>
      <PageHero title={t.explore.productSelector} subtitle={t.explore.productSelectorDesc} />

      <div className="zw-container py-12">
        {step < 3 ? (
          <div className="mx-auto max-w-2xl">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zw-red-600">
              Adım {step + 1} / 3
            </div>
            <h2 className="font-display text-3xl font-bold uppercase">{current.title}</h2>
            <p className="mt-2 text-sm text-zw-grey-600">
              Birden fazla seçenek işaretleyebilirsiniz.
            </p>

            <div className="mt-6 grid gap-3">
              {current.items.map((item) => {
                const selected = current.value.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggle([...current.value], current.set, item.id)}
                    className={`flex items-center gap-3 rounded-[4px] border-2 px-5 py-4 text-left font-semibold transition-colors ${
                      selected
                        ? "border-zw-red-600 bg-zw-red-50"
                        : "border-zw-grey-200 hover:border-zw-grey-500"
                    }`}
                  >
                    {/* Secim kutusu: coklu secim oldugu belli olsun */}
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border-2 ${
                        selected
                          ? "border-zw-red-600 bg-zw-red-600 text-white"
                          : "border-zw-grey-300"
                      }`}
                    >
                      {selected && <Check size={14} strokeWidth={3} />}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="lg"
                disabled={current.value.length === 0}
                onClick={() => setStep((s) => (s + 1) as Step)}
              >
                {step === 2 ? "Sonuçları Gör" : t.common.next}
              </Button>
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)}>
                  {t.common.previous}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-3xl font-bold uppercase">
                Size uygun {results.length} ürün
              </h2>
              <Button variant="outline" size="sm" onClick={reset}>
                Yeniden başla
              </Button>
            </div>
            <ProductGrid products={results} />
          </>
        )}
      </div>
    </>
  );
}
