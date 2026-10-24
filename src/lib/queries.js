import "server-only";
import { prisma } from "./db.js";

export const carCardInclude = {
  category: { select: { name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" }, take: 1 },
  pricing: true,
};

export function getFeaturedCars(take = 6) {
  return prisma.car.findMany({
    where: { isActive: true, isFeatured: true },
    include: carCardInclude,
    orderBy: { popularity: "desc" },
    take,
  });
}

export async function getPublishedReviews(take = 3) {
  return prisma.review.findMany({ where: { isPublished: true }, orderBy: { createdAt: "desc" }, take });
}

export function getActiveLocations() {
  return prisma.serviceLocation.findMany({ where: { isActive: true, kind: "CITY" }, orderBy: { sortOrder: "asc" } });
}
