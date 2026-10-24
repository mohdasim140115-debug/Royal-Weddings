import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/ui";
import CarForm from "@/components/admin/CarForm";

export const metadata = { title: "Add a car" };

export default async function NewCarPage() {
  const categories = await prisma.carCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <Link href="/admin/cars" className="inline-flex min-h-10 items-center gap-2 text-xs uppercase tracking-[0.14em] text-stone hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" /> Cars
      </Link>
      <AdminHeader title="Add a car" intro="You can upload photographs after saving." />
      <CarForm categories={categories} />
    </>
  );
}
