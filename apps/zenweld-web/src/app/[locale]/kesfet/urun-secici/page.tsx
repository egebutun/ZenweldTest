"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { WeldingProcess } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { Button } from "@zenweld/ui";
import { PageHero } from "@/components/common/PageShell";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useT } from "@/lib/i18n-client";

type Step = 0 | 1 | 2 | 3;

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
  const [step, setStep] = useState<Step>(preset ? 1 : 0);
  const [material, setMaterial] = useState<string>(preset);
  const [usage, setUsage] = useState<string>("");
  const [power, setPower] = useState<string>("");

  const materials = [
    { id: "celik", label: "Çelik / Karbon Çeliği", processes: ["MIG", "MAG", "MMA"] },
    { id: "paslanmaz", label: "Paslanmaz Çelik", processes: ["TIG", "MIG", "PULSE"] },
    { id: "aluminyum", label: "Alüminyum", processes: ["TIG", "PULSE", "MIG"] },
    { id: "kesim", label: "Kesim yapacağım", processes: ["PLAZMA"] },
  ];

  const usages = [
    { id: "hobi", label: "Hobi / Ev", max: 15000 },
    { id: "atolye", label: "Küçük Atölye", max: 50000 },
    { id: "sanayi", label: "Sanayi / Seri Üretim", max: Infinity },
  ];

  const powers = [
    { id: "mono", label: "220V Monofaze" },
    { id: "tri", label: "380V Trifaze" },
    { id: "farketmez", label: "Farketmez" },
  ];

  const results = useMemo(() => {
    const selectedMaterial = materials.find((m) => m.id === material);
    const selectedUsage = usages.find((u) => u.id === usage);
    if (!selectedMaterial) return [];

    return db.products.filter((p) => {
      if (!p.active || p.section !== "ekipmanlar") return false;
      if (!p.processes.some((proc) => selectedMaterial.processes.includes(proc as WeldingProcess)))
        return false;
      if (selectedUsage && p.priceExVat > selectedUsage.max) return false;
      if (power === "mono" && p.specs.some((s) => s.value.tr.includes("3 faz"))) return false;
      if (power === "tri" && !p.specs.some((s) => s.value.tr.includes("3 faz"))) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, material, usage, power]);

  const options = [
    { title: "Hangi malzemeyi kaynatacaksınız?", items: materials, value: material, set: setMaterial },
    { title: "Kullanım amacınız nedir?", items: usages, value: usage, set: setUsage },
    { title: "Elektrik altyapınız?", items: powers, value: power, set: setPower },
  ];

  return (
    <>
      <PageHero title={t.explore.productSelector} subtitle={t.explore.productSelectorDesc} />

      <div className="zw-container py-12">
        {step < 3 ? (
          <div className="mx-auto max-w-2xl">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-zw-red-600">
              Adım {step + 1} / 3
            </div>
            <h2 className="font-display text-3xl font-bold uppercase">{options[step].title}</h2>

            <div className="mt-6 grid gap-3">
              {options[step].items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    options[step].set(item.id);
                    setStep((s) => (s + 1) as Step);
                  }}
                  className={`rounded-[4px] border-2 px-5 py-4 text-left font-semibold transition-colors ${
                    options[step].value === item.id
                      ? "border-zw-red-600 bg-zw-red-50"
                      : "border-zw-grey-200 hover:border-zw-grey-500"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {step > 0 && (
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => setStep((s) => (s - 1) as Step)}
              >
                {t.common.previous}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-3xl font-bold uppercase">
                Size uygun {results.length} ürün
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep(0);
                  setMaterial("");
                  setUsage("");
                  setPower("");
                }}
              >
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
