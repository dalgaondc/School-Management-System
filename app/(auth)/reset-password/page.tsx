import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RecoveryHashHandler } from "@/components/recovery-hash-handler";
import { ResetForm } from "./reset-form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <RecoveryHashHandler target="/reset-password" />
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Set a new password</h1>

        {user ? (
          <>
            <p className="mb-6 mt-1 text-sm text-gray-500">
              Choose a new password for {user.email}.
            </p>
            <ResetForm />
          </>
        ) : (
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-gray-600">
              This page needs a valid reset link. If you just clicked one, give it a moment to
              load. Otherwise, request a new link.
            </p>
            <Link href="/forgot-password" className="inline-block underline">
              Request a new reset link
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
