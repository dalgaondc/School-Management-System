import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile, homeFor } from "@/lib/auth";
import { RecoveryHashHandler } from "@/components/recovery-hash-handler";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const profile = await getCurrentProfile();
  if (profile) redirect(homeFor(profile.role));

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <RecoveryHashHandler target="/reset-password" />
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">School Management System</h1>
        <p className="mb-6 mt-1 text-sm text-gray-500">
          Sign in as an administrator or teacher.
        </p>
        <LoginForm />
        <p className="mt-4 text-center text-sm">
          <Link href="/forgot-password" className="text-gray-600 underline">
            Forgot your password?
          </Link>
        </p>
      </div>
    </main>
  );
}
