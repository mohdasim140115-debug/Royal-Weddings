import { prisma } from "@/lib/db";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

// Only real, content-rich pages. No auto-generated location pages.
export default async function sitemap() {
  const statics = ["", "/cars", "/photography", "/wedding-packages", "/booking", "/about", "/contact", "/faq", "/terms", "/privacy", "/cancellation-policy"];
  const cars = await prisma.car.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }).catch(() => []);
  return [
    ...statics.map((p) => ({ url: `${site.url}${p}`, changeFrequency: p === "" || p === "/cars" ? "weekly" : "monthly", priority: p === "" ? 1 : 0.7 })),
    ...cars.map((c) => ({ url: `${site.url}/cars/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly", priority: 0.8 })),
  ];
}
