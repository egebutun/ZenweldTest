import { describe, expect, it } from "vitest";
import {
  applyFilterSelection,
  filterFacets,
  selectionFromQuery,
  tidyFilterValues,
  writeSelectionToQuery,
  type CategoryFilter,
} from "@zenweld/data";
import { product } from "./ornek";

/* docs/IS-KURALLARI.md › 19. Kategori filtreleri */

const series: CategoryFilter = {
  id: "model-serisi",
  name: "Model Serisi",
  values: [
    { id: "ultimate", label: "Ultimate" },
    { id: "evomig", label: "Evomig" },
  ],
};
const mode: CategoryFilter = {
  id: "calisma-modu",
  name: "Çalışma Modu",
  values: [
    { id: "standart", label: "Standart" },
    { id: "puls", label: "Puls" },
  ],
};
const body: CategoryFilter = {
  id: "fiziki-yapi",
  name: "Fiziki Yapı",
  values: [
    { id: "portatif", label: "Portatif" },
    { id: "kompakt", label: "Kompakt" },
  ],
};
const voltage: CategoryFilter = { id: "sebeke-voltaji", name: "Şebeke Voltajı", values: [] };
const filters = [series, voltage, mode, body];

const u1 = product({ id: "u1", filterValues: { "model-serisi": ["ultimate"], "calisma-modu": ["standart"] } });
const u2 = product({ id: "u2", filterValues: { "model-serisi": ["ultimate"], "calisma-modu": ["standart", "puls"] } });
const e1 = product({ id: "e1", filterValues: { "model-serisi": ["evomig"], "calisma-modu": ["puls"] } });
const e2 = product({ id: "e2", filterValues: { "model-serisi": ["evomig"] } });
const all = [u1, u2, e1, e2];
const ids = (list: { id: string }[]) => list.map((p) => p.id);

describe("Kategori filtreleri: sonuç", () => {
  it("aynı filtrede iki değer 'ya o ya bu'dur", () => {
    expect(ids(applyFilterSelection(all, filters, { "model-serisi": ["ultimate", "evomig"] }))).toEqual(["u1", "u2", "e1", "e2"]);
    expect(ids(applyFilterSelection(all, filters, { "model-serisi": ["evomig"] }))).toEqual(["e1", "e2"]);
  });

  it("farklı filtreler birlikte uygulanır; birden çok değerli ürün her değerde çıkar", () => {
    expect(ids(applyFilterSelection(all, filters, { "model-serisi": ["ultimate"], "calisma-modu": ["puls"] }))).toEqual(["u2"]);
    expect(ids(applyFilterSelection(all, filters, { "calisma-modu": ["puls"] }))).toEqual(["u2", "e1"]);
  });

  it("hiçbir ürüne eşlenmemiş filtre seçilse de sonucu daraltmaz", () => {
    expect(ids(applyFilterSelection(all, filters, { "fiziki-yapi": ["kompakt"] }))).toEqual(["u1", "u2", "e1", "e2"]);
  });

  it("bir ürüne değer işaretlenince filtre çalışır; değeri olmayan ürün elenir", () => {
    const mapped = [u1, product({ ...u2, filterValues: { ...u2.filterValues, "fiziki-yapi": ["kompakt"] } }), e1, e2];
    expect(ids(applyFilterSelection(mapped, filters, { "fiziki-yapi": ["kompakt"] }))).toEqual(["u2"]);
  });
});

describe("Kategori filtreleri: görünen filtreler ve sayılar", () => {
  const facets = filterFacets(filters, all, { "model-serisi": ["evomig"] });

  it("değeri olmayan filtre gösterilmez; sıra tanımdaki gibi", () => {
    expect(facets.map((f) => f.name)).toEqual(["Model Serisi", "Çalışma Modu", "Fiziki Yapı"]);
  });

  it("sayı, değer seçilirse kalacak ürün sayısıdır; filtrenin kendi seçimi sayılmaz", () => {
    expect(facets[0].values.map((v) => [v.label, v.count, v.selected])).toEqual([
      ["Ultimate", 2, false],
      ["Evomig", 2, true],
    ]);
    // Evomig seçiliyken: Standart 0, Puls 1 (e1)
    expect(facets[1].values.map((v) => v.count)).toEqual([0, 1]);
  });

  it("eşlenmemiş filtrede sayı yoktur", () => {
    expect(facets[2].mapped).toBe(false);
    expect(facets[2].values.map((v) => v.count)).toEqual([null, null]);
  });
});

describe("Kategori filtreleri: sayfa adresi ve kayıt", () => {
  it("seçim adrese yazılır ve adresten okunur; bilinmeyen değer ve parametre atlanır", () => {
    const params = writeSelectionToQuery(
      new URLSearchParams("secenek=x"),
      { "calisma-modu": ["puls", "standart"], "model-serisi": [] },
      filters,
    );
    expect(params.toString()).toBe("secenek=x&calisma-modu=standart%2Cpuls");
    expect(selectionFromQuery(new URLSearchParams("calisma-modu=puls,yok&baska=1"), filters)).toEqual({
      "calisma-modu": ["puls"],
    });
  });

  it("kayıtta kategoride olmayan filtre ve değer silinir; boş kalırsa alan kalkar", () => {
    expect(
      tidyFilterValues({ "model-serisi": ["evomig", "silinmis"], "eski-filtre": ["x"], "calisma-modu": [] }, filters),
    ).toEqual({ "model-serisi": ["evomig"] });
    expect(tidyFilterValues({ "eski-filtre": ["x"] }, filters)).toBeUndefined();
    expect(tidyFilterValues({ "model-serisi": ["evomig"] }, undefined)).toBeUndefined();
  });
});
