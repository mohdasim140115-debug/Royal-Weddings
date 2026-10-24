import AdminNav from "@/components/admin/AdminNav";
import { requireAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Every admin page renders through this layout, which verifies the session
// and role on the server before anything is shown.
export default async function AdminPanelLayout({ children }) {
  const user = await requireAdminPage();
  const [pending, newEnquiries] = await Promise.all([
    prisma.booking.count({ where: { OR: [{ status: "PENDING" }, { customerRequest: { not: null } }] } }),
    prisma.enquiry.count({ where: { status: "NEW" } }),
  ]);
  return (
    <div className="lg:pl-64">
      <AdminNav user={{ name: user.name, role: user.role }} counts={{ "/admin/bookings": pending, "/admin/enquiries": newEnquiries }} />
      <main className="px-4 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
