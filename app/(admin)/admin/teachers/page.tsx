import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AddTeacherForm } from "./teacher-forms";
import { TeacherRow } from "./teacher-row";
import { createTeacher } from "./actions";

export default async function TeachersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "teacher")
    .order("full_name");

  // Emails live in auth.users, so we need the admin client to read them.
  const admin = createAdminClient();
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map(
    (usersData?.users ?? []).map((u) => [u.id, u.email ?? null])
  );

  const teachers = (profiles ?? []).map((p) => ({
    id: p.id as string,
    full_name: p.full_name as string,
    email: emailById.get(p.id as string) ?? null,
  }));

  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-2xl font-semibold">Teachers</h1>

      <div className="mb-8 rounded-xl border border-gray-200 p-4">
        <p className="mb-3 text-sm font-medium">Add a teacher</p>
        <AddTeacherForm action={createTeacher} />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <TeacherRow key={t.id} teacher={t} />
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                  No teachers yet. Add your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
