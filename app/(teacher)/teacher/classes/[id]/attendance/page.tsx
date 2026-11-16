import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { classLabel, schoolToday } from "@/lib/format";
import { AttendanceGrid } from "./attendance-grid";

type Status = "present" | "absent" | "late" | "excused";

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  await requireRole("teacher");

  const { id } = await params;
  const { date: dateParam } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const today = schoolToday();
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && !Number.isNaN(Date.parse(dateParam))
      ? dateParam
      : today;

  const supabase = await createClient();

  // RLS means a teacher only gets a row back for classes they are assigned to.
  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, section, academic_year")
    .eq("id", id)
    .maybeSingle();
  if (!cls) notFound();

  const [studentsRes, attendanceRes] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, roll_no")
      .eq("class_id", id)
      .order("full_name"),
    supabase.from("attendance").select("student_id, status").eq("class_id", id).eq("date", date),
  ]);

  const students = (studentsRes.data ?? []) as {
    id: string;
    full_name: string;
    roll_no: string | null;
  }[];
  const initial: Record<string, Status> = {};
  for (const r of (attendanceRes.data ?? []) as { student_id: string; status: Status }[]) {
    initial[r.student_id] = r.status;
  }

  const pretty = new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <Link href="/teacher" className="text-sm text-gray-500 hover:underline">
        ← My classes
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold">Attendance</h1>
      <p className="mb-6 text-sm text-gray-600">
        {classLabel(cls)} · {pretty}
      </p>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="date" className="text-xs font-medium text-gray-600">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={date}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">
          Go
        </button>
        {date !== today && (
          <Link
            href={`/teacher/classes/${id}/attendance`}
            className="pb-2 text-sm text-gray-600 underline"
          >
            Back to today
          </Link>
        )}
      </form>

      <AttendanceGrid
        key={date}
        classId={id}
        date={date}
        students={students}
        initial={initial}
      />
    </div>
  );
}
