import { createClient } from "@/lib/supabase/server";

type Assignment = {
  id: string;
  classes: { name: string; section: string | null } | null;
  subjects: { name: string } | null;
};

export default async function TeacherHome() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teacher_assignments")
    .select("id, classes(name, section), subjects(name)");

  const assignments = (data ?? []) as unknown as Assignment[];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">My classes</h1>

      {assignments.length === 0 ? (
        <p className="text-sm text-gray-500">
          No classes assigned yet. An administrator needs to assign you to a class and subject.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {assignments.map((a) => (
            <div key={a.id} className="rounded-xl border border-gray-200 p-4">
              <p className="font-medium">
                {a.classes?.name}
                {a.classes?.section ? ` - ${a.classes.section}` : ""}
              </p>
              <p className="text-sm text-gray-500">{a.subjects?.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
