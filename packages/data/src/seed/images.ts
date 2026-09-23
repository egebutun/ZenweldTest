/**
 * Gorsel havuzu.
 *
 * NOT: Bu ortamdan Unsplash'e erisim proxy tarafindan engellendigi icin
 * linklerin yuklendigi dogrulanamadi. <ProductImage> bileseni, gorsel
 * yuklenemezse otomatik olarak markali SVG placeholder'a duser; yani
 * sitede hicbir zaman kirik gorsel gorunmez.
 *
 * Gercek urun fotograflarini admin panelden (Urunler > Duzenle > Gorseller)
 * URL vererek veya dosya yukleyerek degistirebilirsiniz.
 */

/**
 * Gorseller sitede en fazla ~600 px genisliginde gosteriliyor; 1200 px
 * istemek anasayfada bosuna birkac MB indiriyordu. auto=format sayesinde
 * Unsplash destekleyen tarayiciya webp/avif gonderir.
 */
const U = (id: string, w = 700) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const stockPhotos = {
  weldingSparks: U("1504328345606-18bbc8c9d7d1"),
  welderAtWork: U("1565043666747-69f6646db940"),
  industrialShop: U("1581092160562-40aa08e78837"),
  engineer: U("1581092918056-0c4c3acd3789"),
  metalWork: U("1516937941344-00b4e0337589"),
  factoryLine: U("1567789884554-0b844b597180"),
  toolsFlatlay: U("1530124566582-a618bc2615dc"),
  workshop: U("1504917595217-d4dc5ebe6122"),
  sparksDark: U("1523293182086-7651a899d37f"),
  heroWide: U("1582719508461-905c673771fd", 1400),
  teamTalk: U("1521737604893-d14cc237f11d"),
  blueprint: U("1504307651254-35680f356dfd"),
} as const;

export type StockPhotoKey = keyof typeof stockPhotos;
