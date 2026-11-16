import Link from "next/link";
import { classLabel } from "@/lib/format";
import {
  LOW_ATTENDANCE_PERCENT,
  getAttendanceReport,
  parseAttendanceParams,
} from "@/lib/reports";

const pctText = (p: number | null) => (p === null ? "-" : `${p.toFixed(1)}%`);

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = parseAttendanceParams(await searchParams);
  const { classes, students, classSummary } = await getAttendanceReport(params);

  const qs = new URLSearchParams({ from: params.from, to: params.to });
  if (params.classId) qs.set("class", params.classId);

  const drillHref = (classId: string) => {
    const q = new URLSearchParams({ from: params.from, to: params.to, class: classId });
    return `/admin/reports/attendance?${q.toString()}`;
  };

  const studentRows = [...students].sort((a, b) => {
    if (a.pct === null && b.pct === null) return a.name.localeCompare(b.name);
    if (a.pct === null) return 1;
    if (b.pct === null) return -1;
    return a.pct - b.pct || a.name.localeCompare(b.name);
  });

  return (
    <div className="max-w-5xl">
      <Link href="/admin/reports" className="text-sm text-gray-500 hover:underline">
        ← Reports
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">Attendance report</h1>

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Class</label>
          <select
            name="class"
            defaultValue={params.classId ?? ""}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {classLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">From</label>
          <input
            type="date"
            name="from"
            defaultValue={params.from}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">To</label>
          <input
            type="date"
            name="to"
            defaultValue={params.to}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">
          Apply
        </button>
        <a
          href={`/admin/reports/attendance/export?${qs.toString()}`}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Download CSV
        </a>
      </form>

      <p className="mb-6 text-xs text-gray-500">
        Attendance % = (present + late) ÷ days marked. Students below {LOW_ATTENDANCE_PERCENT}%
        are highlighted. Excused days count as not attended.
      </p>

      {!params.classId && (
        <div className="mb-8 overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Students</th>
                <th className="px-4 py-3 font-medium">Days marked</th>
                <th className="px-4 py-3 font-medium">Present</th>
                <th className="px-4 py-3 font-medium">Absent</th>
                <th className="px-4 py-3 font-medium">Late</th>
                <th className="px-4 py-3 font-medium">Excused</th>
                <th className="px-4 py-3 font-medium">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {classSummary.map((c) => (
                <tr key={c.classId} className="border-t border-gray-200">
                  <td className="px-4 py-3 text-sm font-medium">
                    <Link href={drillHref(c.classId)} className="underline">
                      {c.label}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{c.students}</td>
                  <td className="px-4 py-3 text-sm">{c.days}</td>
                  <td className="px-4 py-3 text-sm">{c.present}</td>
                  <td className="px-4 py-3 text-sm">{c.absent}</td>
                  <td className="px-4 py-3 text-sm">{c.late}</td>
                  <td className="px-4 py-3 text-sm">{c.excused}</td>
                  <td
                    className={`px-4 py-3 text-sm font-medium ${
                      c.pct !== null && c.pct < LOW_ATTENDANCE_PERCENT ? "text-red-600" : ""
                    }`}
                  >
                    {pctText(c.pct)}
                  </td>
                </tr>
              ))}
              {classSummary.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                    No classes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold">
        {params.classId ? "Students (lowest attendance first)" : "All students (lowest attendance first)"}
      </h2>
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 font-medium">Present</th>
              <th className="px-4 py-3 font-medium">Absent</th>
              <th className="px-4 py-3 font-medium">Late</th>
              <th className="px-4 py-3 font-medium">Excused</th>
              <th className="px-4 py-3 font-medium">Days</th>
              <th className="px-4 py-3 font-medium">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {studentRows.map((s) => {
              const low = s.pct !== null && s.pct < LOW_ATTENDANCE_PERCENT;
              return (
                <tr key={s.studentId} className="border-t border-gray-200">
                  <td className="px-4 py-3 text-sm font-medium">
                    {s.name}
                    {s.roll && <span className="ml-2 text-xs text-gray-500">#{s.roll}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.classLabel}</td>
                  <td className="px-4 py-3 text-sm">{s.present}</td>
                  <td className="px-4 py-3 text-sm">{s.absent}</td>
                  <td className="px-4 py-3 text-sm">{s.late}</td>
                  <td className="px-4 py-3 text-sm">{s.excused}</td>
                  <td className="px-4 py-3 text-sm">{s.total}</td>
                  <td className={`px-4 py-3 text-sm font-medium ${low ? "text-red-600" : ""}`}>
                    {pctText(s.pct)}
                  </td>
                </tr>
              );
            })}
            {studentRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
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
