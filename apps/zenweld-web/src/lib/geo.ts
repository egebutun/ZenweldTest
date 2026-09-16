/** Iki koordinat arasi mesafe (km) — Haversine. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Konum izni alinamadiginda sehir secimi icin merkez koordinatlari. */
export const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  "İstanbul": { lat: 41.0082, lng: 28.9784 },
  "Ankara": { lat: 39.9334, lng: 32.8597 },
  "İzmir": { lat: 38.4237, lng: 27.1428 },
  "Bursa": { lat: 40.1885, lng: 29.061 },
  "Konya": { lat: 37.8746, lng: 32.4932 },
  "Gaziantep": { lat: 37.0662, lng: 37.3833 },
  "Adana": { lat: 37.0, lng: 35.3213 },
  "Kayseri": { lat: 38.7312, lng: 35.4787 },
  "Samsun": { lat: 41.2867, lng: 36.33 },
  "Trabzon": { lat: 41.0027, lng: 39.7168 },
  "Antalya": { lat: 36.8969, lng: 30.7133 },
  "Denizli": { lat: 37.7765, lng: 29.0864 },
  "Eskişehir": { lat: 39.7767, lng: 30.5206 },
  "Kocaeli": { lat: 40.8533, lng: 29.8815 },
  "Sakarya": { lat: 40.7889, lng: 30.4053 },
  "Manisa": { lat: 38.6191, lng: 27.4289 },
  "Mersin": { lat: 36.795, lng: 34.6175 },
  "Diyarbakır": { lat: 37.9262, lng: 40.2069 },
  "Erzurum": { lat: 39.9055, lng: 41.2658 },
  "Malatya": { lat: 38.3552, lng: 38.3095 },
  "Van": { lat: 38.4942, lng: 43.38 },
  "Balıkesir": { lat: 39.6484, lng: 27.8826 },
  "Tekirdağ": { lat: 40.9833, lng: 27.5167 },
  "Hatay": { lat: 36.2, lng: 36.1667 },
  "Aydın": { lat: 37.8444, lng: 27.8458 },
};

export const TURKEY_CENTER = { lat: 39.1, lng: 35.6 };
