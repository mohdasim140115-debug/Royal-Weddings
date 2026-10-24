import { redirect } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import AuthForm from "@/components/account/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  return (
    <>
      <PageHeader eyebrow="My account" title="Welcome back" intro="Sign in to view your bookings, payments and receipts." crumbs={[{ label: "Account", href: "/account" }, { label: "Sign in" }]} />
      <section className="container-x py-16">
        <div className="max-w-md">
          <AuthForm mode="login" next={typeof next === "string" ? next : "/account"} />
        </div>
      </section>
    </>
  );
}
