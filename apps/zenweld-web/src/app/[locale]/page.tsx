import {
  BlogTeaser,
  CategoryTiles,
  DealerStrip,
  FeaturedProducts,
  Hero,
  QuoteBanner,
  WhyZenweld,
} from "@/components/home/HomeSections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryTiles />
      <FeaturedProducts />
      <QuoteBanner />
      <WhyZenweld />
      <DealerStrip />
      <BlogTeaser />
    </>
  );
}
