import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";

// Add new admin sections here as you build them.
const nav = [{ href: "/admin", label: "Dashboard" }];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("admin");

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-gray-50 p-4">
        <p className="mb-6 text-sm font-semibold">Admin</p>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm hover:bg-gray-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
          <span className="text-sm text-gray-600">{profile.full_name}</span>
          <form action={signOut}>
            <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100">
              Sign out
            </button>
          </form>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
