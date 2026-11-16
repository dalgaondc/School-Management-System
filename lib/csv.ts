export type Cell = string | number | null | undefined;

function escapeCell(v: Cell): string {
  if (v === null || v === undefined) return "";
  let s = typeof v === "number" ? String(v) : v;
  // Stop spreadsheet apps from running text such as "=SUM(...)" as a formula.
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows: Cell[][]): string {
  // The BOM makes Excel open the file as UTF-8.
  return "\uFEFF" + rows.map((r) => r.map(escapeCell).join(",")).join("\r\n") + "\r\n";
}

export function csvResponse(filename: string, rows: Cell[][]): Response {
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
