import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { classLabel } from "@/lib/format";
import { DeleteButton } from "@/components/delete-button";
import { ExamForm } from "./exam-form";
import { deleteExam } from "./actions";

type ExamRow = {
  id: string;
  name: string;
  max_marks: number;
  subjects: { name: string } | null;
};

export default async function GradesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole("teacher");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();

  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, section, academic_year")
    .eq("id", id)
    .maybeSingle();
  if (!cls) notFound();

  // Subjects this teacher handles in this class.
  const { data: assigned } = await supabase
    .from("teacher_assignments")
    .select("subject_id, subjects(id, name)")
    .eq("teacher_id", profile.id)
    .eq("class_id", id);

  const subjects = ((assigned ?? []) as unknown as {
    subject_id: string;
    subjects: { id: string; name: string } | null;
  }[])
    .map((a) => a.subjects)
    .filter((s): s is { id: string; name: string } => !!s)
    .sort((a, b) => a.name.localeCompare(b.name));
  const subjectIds = subjects.map((s) => s.id);

  const { data: examData } = subjectIds.length
    ? await supabase
        .from("exams")
        .select("id, name, max_marks, subjects(name)")
        .eq("class_id", id)
        .in("subject_id", subjectIds)
        .order("name")
    : { data: [] };
  const exams = (examData ?? []) as unknown as ExamRow[];

  // How many students have marks entered for each exam.
  const [{ count: studentCount }, gradesRes] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }).eq("class_id", id),
    exams.length
      ? supabase.from("grades").select("exam_id").in("exam_id", exams.map((e) => e.id))
      : Promise.resolve({ data: [] as { exam_id: string }[] }),
  ]);
  const graded = new Map<string, number>();
  for (const g of (gradesRes.data ?? []) as { exam_id: string }[]) {
    graded.set(g.exam_id, (graded.get(g.exam_id) ?? 0) + 1);
  }

  return (
    <div className="max-w-4xl">
      <Link href="/teacher" className="text-sm text-gray-500 hover:underline">
        ← My classes
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold">Grades</h1>
      <p className="mb-6 text-sm text-gray-600">{classLabel(cls)}</p>

      <div className="mb-8 rounded-xl border border-gray-200 p-4">
        <p className="mb-3 text-sm font-medium">Create an exam</p>
        <ExamForm classId={id} subjects={subjects} />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Exam</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Max</th>
              <th className="px-4 py-3 font-medium">Marks entered</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {exams.map((e) => (
              <tr key={e.id} className="border-t border-gray-200">
                <td className="px-4 py-3 text-sm font-medium">{e.name}</td>
                <td className="px-4 py-3 text-sm">{e.subjects?.name ?? "-"}</td>
                <td className="px-4 py-3 text-sm">{Number(e.max_marks)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {graded.get(e.id) ?? 0} / {studentCount ?? 0}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/teacher/classes/${id}/grades/${e.id}`}
                      className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
                    >
                      Enter marks
                    </Link>
                    <DeleteButton
                      action={deleteExam}
                      id={e.id}
                      message={`Delete "${e.name}"? All marks entered for it will be deleted too.`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {exams.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No exams yet. Create your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
