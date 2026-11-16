import { createClient } from "@/lib/supabase/server";
import { SubjectForm } from "./subject-form";
import { SubjectRow } from "./subject-row";
import { createSubject } from "./actions";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .order("name");

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Subjects</h1>

      <div className="mb-8 rounded-xl border border-gray-200 p-4">
        <p className="mb-3 text-sm font-medium">Add a subject</p>
        <SubjectForm action={createSubject} submitLabel="Add subject" />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(subjects ?? []).map((s) => (
              <SubjectRow key={s.id} subject={s} />
            ))}
            {(subjects ?? []).length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-sm text-gray-500">
                  No subjects yet. Add your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
