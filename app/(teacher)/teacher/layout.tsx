import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("teacher");

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <Link href="/teacher" className="text-sm font-semibold">
          Teacher
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{profile.full_name}</span>
          <form action={signOut}>
            <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">{children}</main>
    </div>
  );
}
