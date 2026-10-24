import { redirect } from "next/navigation";
import Logo from "@/components/layout/Logo";
import AuthForm from "@/components/account/AuthForm";
import { getCurrentUser, isStaff } from "@/lib/auth";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (isStaff(await getCurrentUser())) redirect("/admin");
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-md border border-line bg-white p-8 sm:p-10">
        <Logo />
        <h1 className="mt-8 text-4xl">Admin sign in</h1>
        <p className="mt-2 text-sm text-stone">Staff and administrators only.</p>
        <div className="mt-8">
          <AuthForm mode="login" scope="admin" next="/admin" />
        </div>
      </div>
    </div>
  );
}
