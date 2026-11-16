import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { classLabel } from "@/lib/format";
import { MarksGrid } from "./marks-grid";

export default async function EnterMarksPage({
  params,
}: {
  params: Promise<{ id: string; examId: string }>;
}) {
  const profile = await requireRole("teacher");
  const { id, examId } = await params;
  const uuidRe = /^[0-9a-f-]{36}$/i;
  if (!uuidRe.test(id) || !uuidRe.test(examId)) notFound();

  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, name, class_id, subject_id, max_marks, subjects(name), classes(name, section, academic_year)")
    .eq("id", examId)
    .eq("class_id", id)
    .maybeSingle();
  if (!exam) notFound();

  // Only the teacher of this class + subject may enter marks.
  const { data: assignment } = await supabase
    .from("teacher_assignments")
    .select("id")
    .eq("teacher_id", profile.id)
    .eq("class_id", id)
    .eq("subject_id", exam.subject_id)
    .maybeSingle();
  if (!assignment) notFound();

  const [studentsRes, gradesRes] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, roll_no")
      .eq("class_id", id)
      .order("full_name"),
    supabase.from("grades").select("student_id, marks").eq("exam_id", examId),
  ]);

  const students = (studentsRes.data ?? []) as {
    id: string;
    full_name: string;
    roll_no: string | null;
  }[];
  const initial: Record<string, string> = {};
  for (const g of (gradesRes.data ?? []) as { student_id: string; marks: number }[]) {
    initial[g.student_id] = String(Number(g.marks));
  }

  const subject = (exam.subjects as unknown as { name: string } | null)?.name;
  const cls = exam.classes as unknown as {
    name: string;
    section: string | null;
    academic_year: string;
  } | null;

  return (
    <div className="max-w-3xl">
      <Link
        href={`/teacher/classes/${id}/grades`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← Exams
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold">{exam.name}</h1>
      <p className="mb-6 text-sm text-gray-600">
        {cls ? classLabel(cls) : ""} · {subject} · out of {Number(exam.max_marks)}
      </p>

      <MarksGrid
        examId={examId}
        maxMarks={Number(exam.max_marks)}
        students={students}
        initial={initial}
      />
    </div>
  );
}
