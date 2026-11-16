import type { NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { csvResponse, slug } from "@/lib/csv";
import { getAttendanceReport, parseAttendanceParams } from "@/lib/reports";

export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const sp = Object.fromEntries(request.nextUrl.searchParams.entries());
  const params = parseAttendanceParams(sp);
  const { classes, students } = await getAttendanceReport(params);

  const rows: (string | number | null)[][] = [
    ["Class", "Roll no", "Student", "Present", "Absent", "Late", "Excused", "Days marked", "Attendance %"],
    ...students.map((s) => [
      s.classLabel,
      s.roll,
      s.name,
      s.present,
      s.absent,
      s.late,
      s.excused,
      s.total,
      s.pct === null ? null : Math.round(s.pct * 10) / 10,
    ]),
  ];

  const cls = params.classId ? classes.find((c) => c.id === params.classId) : null;
  const classPart = cls ? slug(`${cls.name}-${cls.section ?? ""}`) : "all-classes";
  return csvResponse(`attendance_${classPart}_${params.from}_to_${params.to}.csv`, rows);
}
