import { createClient } from "@/lib/supabase/server";
import type { ClassOption } from "@/lib/format";
import { classLabel } from "@/lib/format";
import { StudentForm, type StudentData } from "./student-form";
import { StudentRow } from "./student-row";
import { createStudent } from "./actions";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const { class: classFilter = "" } = await searchParams;
  const supabase = await createClient();

  const { data: classData } = await supabase
    .from("classes")
    .select("id, name, section, academic_year")
    .order("academic_year", { ascending: false })
    .order("name")
    .order("section");
  const classes = (classData ?? []) as ClassOption[];

  let query = supabase
    .from("students")
    .select("id, full_name, roll_no, class_id, guardian_name, guardian_phone")
    .order("full_name");
  if (classFilter === "none") query = query.is("class_id", null);
  else if (classFilter) query = query.eq("class_id", classFilter);

  const { data: studentData } = await query;
  const students = (studentData ?? []) as StudentData[];

  return (
    <div className="max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold">Students</h1>

      <div className="mb-8 rounded-xl border border-gray-200 p-4">
        <p className="mb-3 text-sm font-medium">Add a student</p>
        <StudentForm
          action={createStudent}
          classes={classes}
          defaultClassId={classFilter && classFilter !== "none" ? classFilter : undefined}
          submitLabel="Add student"
        />
      </div>

      <form method="get" className="mb-4 flex items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Filter by class</label>
          <select
            name="class"
            defaultValue={classFilter}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All classes</option>
            <option value="none">Not assigned</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {classLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">
          Apply
        </button>
        <span className="pb-2 text-sm text-gray-500">
          {students.length} student{students.length === 1 ? "" : "s"}
        </span>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Roll</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 font-medium">Guardian</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <StudentRow key={s.id} student={s} classes={classes} />
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
