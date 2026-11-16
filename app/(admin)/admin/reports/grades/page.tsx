import Link from "next/link";
import { classLabel } from "@/lib/format";
import { PASS_PERCENT, getExamSummaries, parseClassParam } from "@/lib/reports";

export default async function GradesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const classId = parseClassParam((await searchParams).class);
  const { classes, exams } = await getExamSummaries(classId);

  const exportHref = `/admin/reports/grades/export${classId ? `?class=${classId}` : ""}`;
  const num = (n: number | null) => (n === null ? "-" : String(n));

  return (
    <div className="max-w-6xl">
      <Link href="/admin/reports" className="text-sm text-gray-500 hover:underline">
        ← Reports
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">Grades report</h1>

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Class</label>
          <select
            name="class"
            defaultValue={classId ?? ""}
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
        <button className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">
          Apply
        </button>
        <a
          href={exportHref}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Download CSV
        </a>
      </form>

      <p className="mb-6 text-xs text-gray-500">
        Pass rate counts marks at or above {PASS_PERCENT}% of the maximum. Statistics use only
        students who have a mark entered.
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Exam</th>
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Max</th>
              <th className="px-4 py-3 font-medium">Entered</th>
              <th className="px-4 py-3 font-medium">Average</th>
              <th className="px-4 py-3 font-medium">Highest</th>
              <th className="px-4 py-3 font-medium">Lowest</th>
              <th className="px-4 py-3 font-medium">Pass rate</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {exams.map((e) => (
              <tr key={e.id} className="border-t border-gray-200">
                <td className="px-4 py-3 text-sm font-medium">{e.name}</td>
                <td className="px-4 py-3 text-sm">{e.classLabel}</td>
                <td className="px-4 py-3 text-sm">{e.subject}</td>
                <td className="px-4 py-3 text-sm">{e.max}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {e.entered} / {e.studentCount}
                </td>
                <td className="px-4 py-3 text-sm">
                  {e.average === null ? "-" : `${e.average} (${e.averagePct}%)`}
                </td>
                <td className="px-4 py-3 text-sm">{num(e.highest)}</td>
                <td className="px-4 py-3 text-sm">{num(e.lowest)}</td>
                <td className="px-4 py-3 text-sm">
                  {e.passRate === null ? "-" : `${e.passRate}%`}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/reports/grades/${e.id}`}
                    className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {exams.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-500">
                  No exams found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
