import "server-only";
import { createClient } from "@/lib/supabase/server";
import { classLabel, schoolToday, type ClassOption } from "@/lib/format";

export const PASS_PERCENT = 40; // a mark at or above 40% of the maximum counts as a pass
export const LOW_ATTENDANCE_PERCENT = 75; // attendance below this is highlighted

const PAGE = 1000; // Supabase returns at most 1000 rows per request
const UUID = /^[0-9a-f-]{36}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

async function fetchAll<T>(build: (from: number, to: number) => Page<T>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

function addDays(s: string, d: number) {
  const dt = new Date(`${s}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + d);
  return dt.toISOString().slice(0, 10);
}

const isRealDate = (v?: string): v is string =>
  !!v && DATE.test(v) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;

const round1 = (n: number) => Math.round(n * 10) / 10;

// ===================== ATTENDANCE =====================

export type AttendanceParams = { classId: string | null; from: string; to: string };

export function parseAttendanceParams(sp: Record<string, string | undefined>): AttendanceParams {
  const today = schoolToday();
  let from = isRealDate(sp.from) ? sp.from : addDays(today, -29);
  let to = isRealDate(sp.to) ? sp.to : today;
  if (from > to) [from, to] = [to, from];
  const classId = sp.class && UUID.test(sp.class) ? sp.class : null;
  return { classId, from, to };
}

export type StudentAttendance = {
  studentId: string;
  name: string;
  roll: string | null;
  classId: string;
  classLabel: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  pct: number | null; // (present + late) / days marked
};

export type ClassAttendance = {
  classId: string;
  label: string;
  students: number;
  days: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  pct: number | null;
};

export async function getAttendanceReport(p: AttendanceParams) {
  const supabase = await createClient();

  const [classData, students, records] = await Promise.all([
    fetchAll<ClassOption>((a, b) =>
      supabase
        .from("classes")
        .select("id, name, section, academic_year")
        .order("academic_year", { ascending: false })
        .order("name")
        .order("section")
        .range(a, b) as unknown as Page<ClassOption>
    ),
    fetchAll<{ id: string; full_name: string; roll_no: string | null; class_id: string }>((a, b) => {
      let q = supabase
        .from("students")
        .select("id, full_name, roll_no, class_id")
        .not("class_id", "is", null);
      if (p.classId) q = q.eq("class_id", p.classId);
      return q.order("id").range(a, b) as unknown as Page<{
        id: string; full_name: string; roll_no: string | null; class_id: string;
      }>;
    }),
    fetchAll<{ student_id: string; class_id: string; date: string; status: string }>((a, b) => {
      let q = supabase
        .from("attendance")
        .select("student_id, class_id, date, status")
        .gte("date", p.from)
        .lte("date", p.to);
      if (p.classId) q = q.eq("class_id", p.classId);
      return q.order("id").range(a, b) as unknown as Page<{
        student_id: string; class_id: string; date: string; status: string;
      }>;
    }),
  ]);

  const labelById = new Map(classData.map((c) => [c.id, classLabel(c)]));

  const byStudent = new Map<string, StudentAttendance>();
  for (const s of students) {
    byStudent.set(s.id, {
      studentId: s.id,
      name: s.full_name,
      roll: s.roll_no,
      classId: s.class_id,
      classLabel: labelById.get(s.class_id) ?? "-",
      present: 0, absent: 0, late: 0, excused: 0, total: 0, pct: null,
    });
  }

  const daysByClass = new Map<string, Set<string>>();
  for (const r of records) {
    const row = byStudent.get(r.student_id);
    if (!row) continue;
    if (r.status === "present") row.present++;
    else if (r.status === "absent") row.absent++;
    else if (r.status === "late") row.late++;
    else if (r.status === "excused") row.excused++;
    else continue;
    row.total++;
    const set = daysByClass.get(r.class_id) ?? new Set<string>();
    set.add(r.date);
    daysByClass.set(r.class_id, set);
  }
  for (const row of byStudent.values()) {
    row.pct = row.total > 0 ? ((row.present + row.late) / row.total) * 100 : null;
  }

  const studentRows = [...byStudent.values()].sort(
    (a, b) => a.classLabel.localeCompare(b.classLabel) || a.name.localeCompare(b.name)
  );

  const classRows: ClassAttendance[] = classData
    .filter((c) => !p.classId || c.id === p.classId)
    .map((c) => {
      const mine = studentRows.filter((s) => s.classId === c.id);
      const sum = (k: "present" | "absent" | "late" | "excused" | "total") =>
        mine.reduce((acc, s) => acc + s[k], 0);
      const total = sum("total");
      return {
        classId: c.id,
        label: classLabel(c),
        students: mine.length,
        days: daysByClass.get(c.id)?.size ?? 0,
        present: sum("present"),
        absent: sum("absent"),
        late: sum("late"),
        excused: sum("excused"),
        total,
        pct: total > 0 ? ((sum("present") + sum("late")) / total) * 100 : null,
      };
    });

  return { classes: classData, students: studentRows, classSummary: classRows };
}

// ===================== GRADES =====================

type ExamRaw = {
  id: string;
  name: string;
  class_id: string;
  max_marks: number;
  subjects: { name: string } | null;
  classes: { name: string; section: string | null; academic_year: string } | null;
};

export type ExamSummary = {
  id: string;
  name: string;
  classId: string;
  classLabel: string;
  subject: string;
  max: number;
  studentCount: number;
  entered: number;
  average: number | null;
  averagePct: number | null;
  highest: number | null;
  lowest: number | null;
  passRate: number | null;
};

export function parseClassParam(v?: string): string | null {
  return v && UUID.test(v) ? v : null;
}

function summarise(
  exam: ExamRaw,
  marks: number[],
  studentCount: number
): ExamSummary {
  const max = Number(exam.max_marks);
  const n = marks.length;
  const sum = marks.reduce((a, b) => a + b, 0);
  const passed = marks.filter((m) => (m / max) * 100 >= PASS_PERCENT).length;
  return {
    id: exam.id,
    name: exam.name,
    classId: exam.class_id,
    classLabel: exam.classes ? classLabel(exam.classes) : "-",
    subject: exam.subjects?.name ?? "-",
    max,
    studentCount,
    entered: n,
    average: n ? round1(sum / n) : null,
    averagePct: n ? round1((sum / n / max) * 100) : null,
    highest: n ? Math.max(...marks) : null,
    lowest: n ? Math.min(...marks) : null,
    passRate: n ? round1((passed / n) * 100) : null,
  };
}

export async function getExamSummaries(classId: string | null) {
  const supabase = await createClient();

  const [classData, exams, students, grades] = await Promise.all([
    fetchAll<ClassOption>((a, b) =>
      supabase
        .from("classes")
        .select("id, name, section, academic_year")
        .order("academic_year", { ascending: false })
        .order("name")
        .order("section")
        .range(a, b) as unknown as Page<ClassOption>
    ),
    fetchAll<ExamRaw>((a, b) => {
      let q = supabase
        .from("exams")
        .select("id, name, class_id, max_marks, subjects(name), classes(name, section, academic_year)");
      if (classId) q = q.eq("class_id", classId);
      return q.order("id").range(a, b) as unknown as Page<ExamRaw>;
    }),
    fetchAll<{ id: string; class_id: string | null }>((a, b) =>
      supabase.from("students").select("id, class_id").order("id").range(a, b) as unknown as Page<{
        id: string; class_id: string | null;
      }>
    ),
    fetchAll<{ exam_id: string; marks: number }>((a, b) =>
      supabase.from("grades").select("exam_id, marks").order("id").range(a, b) as unknown as Page<{
        exam_id: string; marks: number;
      }>
    ),
  ]);

  const studentsByClass = new Map<string, number>();
  for (const s of students) {
    if (s.class_id) studentsByClass.set(s.class_id, (studentsByClass.get(s.class_id) ?? 0) + 1);
  }
  const marksByExam = new Map<string, number[]>();
  for (const g of grades) {
    const arr = marksByExam.get(g.exam_id) ?? [];
    arr.push(Number(g.marks));
    marksByExam.set(g.exam_id, arr);
  }

  const summaries = exams
    .map((e) => summarise(e, marksByExam.get(e.id) ?? [], studentsByClass.get(e.class_id) ?? 0))
    .sort(
      (a, b) =>
        a.classLabel.localeCompare(b.classLabel) ||
        a.subject.localeCompare(b.subject) ||
        a.name.localeCompare(b.name)
    );

  return { classes: classData, exams: summaries };
}

export type ExamResultRow = {
  studentId: string;
  name: string;
  roll: string | null;
  marks: number | null;
  pct: number | null;
  passed: boolean | null;
  rank: number | null;
};

export async function getExamDetail(examId: string) {
  if (!UUID.test(examId)) return null;
  const supabase = await createClient();

  const { data: examData } = await supabase
    .from("exams")
    .select("id, name, class_id, max_marks, subjects(name), classes(name, section, academic_year)")
    .eq("id", examId)
    .maybeSingle();
  if (!examData) return null;
  const exam = examData as unknown as ExamRaw;

  const [students, grades] = await Promise.all([
    fetchAll<{ id: string; full_name: string; roll_no: string | null }>((a, b) =>
      supabase
        .from("students")
        .select("id, full_name, roll_no")
        .eq("class_id", exam.class_id)
        .order("id")
        .range(a, b) as unknown as Page<{ id: string; full_name: string; roll_no: string | null }>
    ),
    fetchAll<{ student_id: string; marks: number }>((a, b) =>
      supabase
        .from("grades")
        .select("student_id, marks")
        .eq("exam_id", examId)
        .order("id")
        .range(a, b) as unknown as Page<{ student_id: string; marks: number }>
    ),
  ]);

  const max = Number(exam.max_marks);
  const marksById = new Map(grades.map((g) => [g.student_id, Number(g.marks)]));

  const rows: ExamResultRow[] = students.map((s) => {
    const m = marksById.get(s.id);
    const pct = m === undefined ? null : round1((m / max) * 100);
    return {
      studentId: s.id,
      name: s.full_name,
      roll: s.roll_no,
      marks: m ?? null,
      pct,
      passed: pct === null ? null : pct >= PASS_PERCENT,
      rank: null,
    };
  });

  // Rank by marks, highest first; equal marks share a rank.
  const graded = rows
    .filter((r) => r.marks !== null)
    .sort((a, b) => (b.marks as number) - (a.marks as number) || a.name.localeCompare(b.name));
  graded.forEach((r, i) => {
    r.rank = i > 0 && r.marks === graded[i - 1].marks ? (graded[i - 1].rank as number) : i + 1;
  });
  const ungraded = rows.filter((r) => r.marks === null).sort((a, b) => a.name.localeCompare(b.name));

  return {
    summary: summarise(exam, [...marksById.values()], students.length),
    rows: [...graded, ...ungraded],
  };
}
