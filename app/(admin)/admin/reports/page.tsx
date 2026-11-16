import Link from "next/link";

const reports = [
  {
    href: "/admin/reports/attendance",
    title: "Attendance report",
    text: "Attendance percentages by class or student over any date range. Highlights low attendance.",
  },
  {
    href: "/admin/reports/grades",
    title: "Grades report",
    text: "Average, highest, lowest and pass rate for every exam, with student rankings.",
  },
];

export default function ReportsHome() {
  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-2xl font-semibold">Reports</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="rounded-xl border border-gray-200 p-5 hover:bg-gray-50"
          >
            <p className="font-medium">{r.title}</p>
            <p className="mt-1 text-sm text-gray-500">{r.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
