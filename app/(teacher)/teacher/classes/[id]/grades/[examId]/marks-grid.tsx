"use client";

import { useActionState, useState } from "react";
import { saveGrades, type GradesState } from "../actions";

type Student = { id: string; full_name: string; roll_no: string | null };

export function MarksGrid({
  examId,
  maxMarks,
  students,
  initial,
}: {
  examId: string;
  maxMarks: number;
  students: Student[];
  initial: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [state, formAction, pending] = useActionState<GradesState, FormData>(
    saveGrades,
    undefined
  );

  const entered = students
    .map((s) => values[s.id])
    .filter((v) => v !== undefined && v.trim() !== "")
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const average = entered.length
    ? entered.reduce((a, b) => a + b, 0) / entered.length
    : null;

  if (students.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
        There are no students in this class yet. Ask an administrator to add some.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="exam_id" value={examId} />

      <p className="text-sm text-gray-600">
        {entered.length} of {students.length} entered
        {average !== null &&
          ` · average ${average.toFixed(1)} / ${maxMarks} (${((average / maxMarks) * 100).toFixed(0)}%)`}
      </p>

      <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200">
        {students.map((s) => {
          const raw = values[s.id] ?? "";
          const n = Number(raw);
          const invalid = raw.trim() !== "" && (!Number.isFinite(n) || n < 0 || n > maxMarks);
          return (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.full_name}</p>
                {s.roll_no && <p className="text-xs text-gray-500">Roll {s.roll_no}</p>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  name={`marks_${s.id}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max={maxMarks}
                  step="any"
                  value={raw}
                  onChange={(e) => setValues((p) => ({ ...p, [s.id]: e.target.value }))}
                  aria-label={`Marks for ${s.full_name}`}
                  className={`w-24 rounded-md border px-3 py-1.5 text-right text-sm outline-none focus:ring-1 ${
                    invalid
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                  }`}
                />
                <span className="w-12 text-sm text-gray-500">/ {maxMarks}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save marks"}
        </button>
        {state?.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-sm text-green-700">Saved marks for {state.saved} students.</p>
        )}
      </div>
    </form>
  );
}
