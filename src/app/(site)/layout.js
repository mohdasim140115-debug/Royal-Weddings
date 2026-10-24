import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { prisma } from "@/lib/db";

// Public pages are cached and regenerated at most every 5 minutes. Pages that
// read searchParams or cookies render per request automatically, and admin
// edits call revalidatePath() so catalogue changes appear immediately.
export const revalidate = 300;

export default async function SiteLayout({ children }) {
  const demoCount = await prisma.car.count({ where: { isDemo: true, isActive: true } }).catch(() => 0);
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter hasDemoData={demoCount > 0} />
    </>
  );
}
