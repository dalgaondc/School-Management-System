import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { classLabel } from "@/lib/format";

type Assignment = {
  id: string;
  classes: {
    id: string;
    name: string;
    section: string | null;
    academic_year: string;
  } | null;
  subjects: { name: string } | null;
};

export default async function TeacherHome() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teacher_assignments")
    .select("id, classes(id, name, section, academic_year), subjects(name)");

  const assignments = (data ?? []) as unknown as Assignment[];

  // One card per class, listing every subject the teacher handles there.
  const byClass = new Map<
    string,
    { cls: NonNullable<Assignment["classes"]>; subjects: string[] }
  >();
  for (const a of assignments) {
    if (!a.classes) continue;
    const entry = byClass.get(a.classes.id) ?? { cls: a.classes, subjects: [] };
    if (a.subjects?.name) entry.subjects.push(a.subjects.name);
    byClass.set(a.classes.id, entry);
  }
  const cards = [...byClass.values()].sort((a, b) =>
    classLabel(a.cls).localeCompare(classLabel(b.cls))
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">My classes</h1>

      {cards.length === 0 ? (
        <p className="text-sm text-gray-500">
          No classes assigned yet. An administrator needs to assign you to a class and subject.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map(({ cls, subjects }) => (
            <div key={cls.id} className="rounded-xl border border-gray-200 p-4">
              <p className="font-medium">{classLabel(cls)}</p>
              <p className="mb-4 text-sm text-gray-500">{subjects.join(", ") || "-"}</p>
              <div className="flex gap-2">
                <Link
                  href={`/teacher/classes/${cls.id}/attendance`}
                  className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Attendance
                </Link>
                <Link
                  href={`/teacher/classes/${cls.id}/grades`}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-100"
                >
                  Grades
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
