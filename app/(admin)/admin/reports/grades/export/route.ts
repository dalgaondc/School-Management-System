import type { NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { csvResponse, slug } from "@/lib/csv";
import { getExamSummaries, parseClassParam } from "@/lib/reports";

export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const classId = parseClassParam(request.nextUrl.searchParams.get("class") ?? undefined);
  const { exams } = await getExamSummaries(classId);

  const rows: (string | number | null)[][] = [
    ["Exam", "Class", "Subject", "Max marks", "Marks entered", "Students", "Average", "Average %", "Highest", "Lowest", "Pass rate %"],
    ...exams.map((e) => [
      e.name, e.classLabel, e.subject, e.max, e.entered, e.studentCount,
      e.average, e.averagePct, e.highest, e.lowest, e.passRate,
    ]),
  ];

  const classPart = classId && exams[0] ? slug(exams[0].classLabel) : "all-classes";
  return csvResponse(`grades-summary_${classPart}.csv`, rows);
}
