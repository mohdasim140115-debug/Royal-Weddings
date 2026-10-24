import Hero from "@/components/home/Hero";
import ServiceSelector from "@/components/home/ServiceSelector";
import FeaturedCars from "@/components/home/FeaturedCars";
import HowItWorks from "@/components/home/HowItWorks";
import PortfolioTeaser from "@/components/home/PortfolioTeaser";
import PackagesTeaser from "@/components/home/PackagesTeaser";
import TrustSection from "@/components/home/TrustSection";
import { prisma } from "@/lib/db";
import { getFeaturedCars, getPublishedReviews, getActiveLocations } from "@/lib/queries";
import { site } from "@/config/site";

export const metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [cars, portfolio, packages, reviews, locations] = await Promise.all([
    getFeaturedCars(6),
    prisma.portfolioItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 4, skip: 0 }),
    prisma.weddingPackage.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 3 }),
    getPublishedReviews(3),
    getActiveLocations(),
  ]);

  // Only factual organisation data — no ratings unless real reviews exist.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: site.name,
    description: site.description,
    url: site.url,
    image: `${site.url}/images/cars/thar-black.jpg`,
    ...(site.contact.phone ? { telephone: site.contact.phone } : {}),
    ...(site.contact.email ? { email: site.contact.email } : {}),
    ...(site.contact.address ? { address: site.contact.address } : {}),
  };

  return (
    <>
      <Hero cars={cars} />
      <ServiceSelector />
      <FeaturedCars cars={cars} />
      <HowItWorks />
      <PortfolioTeaser items={portfolio} isDemo={portfolio.some((p) => p.isDemo)} />
      <PackagesTeaser packages={packages} />
      <TrustSection reviews={reviews} locations={locations} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
