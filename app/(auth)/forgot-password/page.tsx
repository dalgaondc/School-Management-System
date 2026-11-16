import Link from "next/link";
import { ForgotForm } from "./forgot-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Forgot your password?</h1>
        <p className="mb-6 mt-1 text-sm text-gray-500">
          Enter your email and we will send you a link to set a new one.
        </p>

        {error === "expired" && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            That reset link is invalid or has expired. Request a new one below.
          </p>
        )}

        <ForgotForm />

        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-gray-600 underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
