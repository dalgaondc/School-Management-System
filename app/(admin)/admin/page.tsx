import { createClient } from "@/lib/supabase/server";

async function count(table: string, filter?: [string, string]) {
  const supabase = await createClient();
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = q.eq(filter[0], filter[1]);
  const { count } = await q;
  return count ?? 0;
}

export default async function AdminDashboard() {
  const [classes, students, teachers, subjects] = await Promise.all([
    count("classes"),
    count("students"),
    count("profiles", ["role", "teacher"]),
    count("subjects"),
  ]);

  const stats = [
    { label: "Classes", value: classes },
    { label: "Students", value: students },
    { label: "Teachers", value: teachers },
    { label: "Subjects", value: subjects },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-3xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
