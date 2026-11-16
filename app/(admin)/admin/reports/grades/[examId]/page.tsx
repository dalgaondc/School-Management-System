import Link from "next/link";
import { notFound } from "next/navigation";
import { PASS_PERCENT, getExamDetail } from "@/lib/reports";

export default async function ExamReportPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const detail = await getExamDetail(examId);
  if (!detail) notFound();
  const { summary: s, rows } = detail;

  const stats = [
    { label: "Marks entered", value: `${s.entered} / ${s.studentCount}` },
    { label: "Average", value: s.average === null ? "-" : `${s.average} (${s.averagePct}%)` },
    { label: "Highest", value: s.highest === null ? "-" : String(s.highest) },
    { label: "Lowest", value: s.lowest === null ? "-" : String(s.lowest) },
    { label: "Pass rate", value: s.passRate === null ? "-" : `${s.passRate}%` },
  ];

  return (
    <div className="max-w-4xl">
      <Link href="/admin/reports/grades" className="text-sm text-gray-500 hover:underline">
        ← Grades report
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold">{s.name}</h1>
      <p className="mb-6 text-sm text-gray-600">
        {s.classLabel} · {s.subject} · out of {s.max}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map((x) => (
          <div key={x.label} className="rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{x.label}</p>
            <p className="mt-1 text-lg font-semibold">{x.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-gray-500">Pass mark: {PASS_PERCENT}% of maximum.</p>
        <a
          href={`/admin/reports/grades/${examId}/export`}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Download CSV
        </a>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Rank</th>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Marks</th>
              <th className="px-4 py-3 font-medium">Percentage</th>
              <th className="px-4 py-3 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.studentId} className="border-t border-gray-200">
                <td className="px-4 py-3 text-sm text-gray-600">{r.rank ?? "-"}</td>
                <td className="px-4 py-3 text-sm font-medium">
                  {r.name}
                  {r.roll && <span className="ml-2 text-xs text-gray-500">#{r.roll}</span>}
                </td>
                <td className="px-4 py-3 text-sm">
                  {r.marks === null ? "-" : `${r.marks} / ${s.max}`}
                </td>
                <td className="px-4 py-3 text-sm">{r.pct === null ? "-" : `${r.pct}%`}</td>
                <td
                  className={`px-4 py-3 text-sm font-medium ${
                    r.passed === null ? "text-gray-400" : r.passed ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {r.passed === null ? "No mark" : r.passed ? "Pass" : "Fail"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  There are no students in this class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
