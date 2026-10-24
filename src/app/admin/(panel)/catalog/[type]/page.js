import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/ui";
import CatalogManager from "@/components/admin/CatalogManager";
import { CATALOGS } from "@/config/admin-catalog";

export async function generateMetadata({ params }) {
  const { type } = await params;
  return { title: CATALOGS[type]?.title || "Catalogue" };
}

export default async function CatalogTypePage({ params }) {
  const { type } = await params;
  const cfg = CATALOGS[type];
  if (!cfg) notFound();
  const [rows, user] = await Promise.all([prisma[cfg.model].findMany({ orderBy: cfg.order }), getCurrentUser()]);

  return (
    <>
      <Link href="/admin/catalog" className="inline-flex min-h-10 items-center gap-2 text-xs uppercase tracking-[0.14em] text-stone hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" /> Catalogue
      </Link>
      <AdminHeader title={cfg.title} />
      <CatalogManager type={type} rows={JSON.parse(JSON.stringify(rows))} canDelete={user?.role === "ADMIN"} />
    </>
  );
}
