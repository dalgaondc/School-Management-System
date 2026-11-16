import type { NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { csvResponse, slug } from "@/lib/csv";
import { getExamDetail } from "@/lib/reports";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ examId: string }> }
) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const { examId } = await ctx.params;
  const detail = await getExamDetail(examId);
  if (!detail) return new Response("Not found", { status: 404 });
  const { summary: s, rows } = detail;

  const out: (string | number | null)[][] = [
    ["Rank", "Roll no", "Student", "Marks", "Max marks", "Percentage", "Result"],
    ...rows.map((r) => [
      r.rank,
      r.roll,
      r.name,
      r.marks,
      s.max,
      r.pct,
      r.passed === null ? "No mark" : r.passed ? "Pass" : "Fail",
    ]),
  ];

  return csvResponse(`${slug(`${s.classLabel}-${s.subject}-${s.name}`)}.csv`, out);
}
