import { createClient } from "@/lib/supabase/server";
import { ClassForm } from "./class-form";
import { ClassRow } from "./class-row";
import { createClass } from "./actions";

export default async function ClassesPage() {
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, section, academic_year")
    .order("academic_year", { ascending: false })
    .order("name")
    .order("section");

  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-2xl font-semibold">Classes</h1>

      <div className="mb-8 rounded-xl border border-gray-200 p-4">
        <p className="mb-3 text-sm font-medium">Add a class</p>
        <ClassForm action={createClass} submitLabel="Add class" />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 font-medium">Section</th>
              <th className="px-4 py-3 font-medium">Academic year</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(classes ?? []).map((c) => (
              <ClassRow key={c.id} cls={c} />
            ))}
            {(classes ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  No classes yet. Add your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
