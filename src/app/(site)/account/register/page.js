import { redirect } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import AuthForm from "@/components/account/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Create an account", robots: { index: false } };

export default async function RegisterPage({ searchParams }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  return (
    <>
      <PageHeader eyebrow="My account" title="Create your account" intro="An account is optional — it keeps all your bookings in one place. You can always book as a guest." crumbs={[{ label: "Account", href: "/account" }, { label: "Register" }]} />
      <section className="container-x py-16">
        <div className="max-w-md">
          <AuthForm mode="register" next={typeof next === "string" ? next : "/account"} />
        </div>
      </section>
    </>
  );
}
