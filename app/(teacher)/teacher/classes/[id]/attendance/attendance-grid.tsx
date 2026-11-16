"use client";

import { useActionState, useState } from "react";
import { saveAttendance, type AttendanceState } from "./actions";

type Status = "present" | "absent" | "late" | "excused";
type Student = { id: string; full_name: string; roll_no: string | null };

const OPTIONS: { value: Status; label: string; active: string }[] = [
  { value: "present", label: "Present", active: "bg-green-600 text-white border-green-600" },
  { value: "absent", label: "Absent", active: "bg-red-600 text-white border-red-600" },
  { value: "late", label: "Late", active: "bg-amber-500 text-white border-amber-500" },
  { value: "excused", label: "Excused", active: "bg-blue-600 text-white border-blue-600" },
];

export function AttendanceGrid({
  classId,
  date,
  students,
  initial,
}: {
  classId: string;
  date: string;
  students: Student[];
  initial: Record<string, Status>;
}) {
  const [statuses, setStatuses] = useState<Record<string, Status>>(initial);
  const [state, formAction, pending] = useActionState<AttendanceState, FormData>(
    saveAttendance,
    undefined
  );

  const set = (id: string, s: Status) =>
    setStatuses((prev) => ({ ...prev, [id]: s }));

  const markAllPresent = () =>
    setStatuses(Object.fromEntries(students.map((s) => [s.id, "present" as Status])));

  const counts = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const s of students) {
    const st = statuses[s.id];
    if (st) counts[st]++;
  }
  const unmarked = students.filter((s) => !statuses[s.id]).length;

  if (students.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
        There are no students in this class yet. Ask an administrator to add some.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="class_id" value={classId} />
      <input type="hidden" name="date" value={date} />
      {students.map((s) =>
        statuses[s.id] ? (
          <input key={s.id} type="hidden" name={`status_${s.id}`} value={statuses[s.id]} />
        ) : null
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={markAllPresent}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          Mark all present
        </button>
        <p className="text-sm text-gray-600">
          {counts.present} present · {counts.absent} absent · {counts.late} late ·{" "}
          {counts.excused} excused
          {unmarked > 0 && ` · ${unmarked} not marked`}
        </p>
      </div>

      <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200">
        {students.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{s.full_name}</p>
              {s.roll_no && <p className="text-xs text-gray-500">Roll {s.roll_no}</p>}
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Status for ${s.full_name}`}>
              {OPTIONS.map((o) => {
                const selected = statuses[s.id] === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => set(s.id, o.value)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                      selected
                        ? o.active
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save attendance"}
        </button>
        {state?.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-sm text-green-700">Saved attendance for {state.count} students.</p>
        )}
      </div>
    </form>
  );
}
