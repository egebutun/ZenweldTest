/**
 * Esanlamli sozlugu.
 *
 * Kullanici "gazalti" yazdiginda MIG urunleri, "argon" yazdiginda TIG urunleri,
 * "cubuk" yazdiginda elektrotlar gelsin diye sorgu genisletmede kullanilir.
 * Anahtarlar ve degerler normalize edilmis (Turkce karaktersiz) yazilir.
 */
export const SYNONYMS: Record<string, string[]> = {
  mig: ["gazalti", "gmaw", "gaz alti", "telli"],
  gazalti: ["mig", "gmaw"],
  gmaw: ["mig", "gazalti"],
  tig: ["argon", "gtaw", "arjon"],
  argon: ["tig", "gtaw"],
  gtaw: ["tig", "argon"],
  mma: ["ortulu", "elektrot", "cubuk", "stick", "ark"],
  elektrot: ["mma", "ortulu", "stick"],
  ortulu: ["mma", "elektrot", "stick"],
  stick: ["mma", "elektrot", "ortulu"],
  plazma: ["kesme", "kesici", "plasma", "cut"],
  kesme: ["plazma", "plasma"],
  invertor: ["inverter", "invertorlu"],
  inverter: ["invertor"],
  maske: ["kask", "helmet", "gozluk", "siperlik"],
  kask: ["maske", "helmet"],
  eldiven: ["glove", "kaynak eldiveni"],
  tel: ["wire", "makara", "bobin"],
  makara: ["tel", "bobin", "spool"],
  torc: ["torch", "pistol", "tabanca", "uflec"],
  torch: ["torc"],
  regulator: ["manometre", "flowmetre", "debimetre"],
  manometre: ["regulator"],
  pense: ["klemens", "sase", "clamp"],
  sase: ["pense", "toprak", "clamp"],
  pulse: ["darbeli", "puls"],
  aluminyum: ["alu", "aluminium", "aluminyum kaynak"],
  paslanmaz: ["inox", "stainless", "304", "316"],
  makine: ["makinesi", "makinasi", "machine", "cihaz"],
  makinesi: ["makine", "makinasi"],
  makinasi: ["makine", "makinesi"],
  kaynak: ["welding", "weld"],
  welding: ["kaynak"],
  cnc: ["otomasyon", "tezgah"],
  duman: ["emis", "aspirator", "fume"],
};

/** Sorguyu esanlamlilarla genisletir. */
export function expandQuery(normalizedQuery: string): string[] {
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const expanded = new Set<string>(terms);
  terms.forEach((term) => {
    (SYNONYMS[term] ?? []).forEach((syn) => {
      syn.split(/\s+/).forEach((s) => expanded.add(s));
    });
  });
  return Array.from(expanded);
}
