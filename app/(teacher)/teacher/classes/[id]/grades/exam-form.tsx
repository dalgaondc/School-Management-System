"use client";

import { useActionState, useEffect, useRef } from "react";
import { createExam, type FormState } from "./actions";

const inputCls =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

export function ExamForm({
  classId,
  subjects,
}: {
  classId: string;
  subjects: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createExam,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="class_id" value={classId} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56 space-y-1">
          <label className="text-xs font-medium text-gray-600">Exam name</label>
          <input name="name" required placeholder="Midterm 2026" className={inputCls} />
        </div>
        <div className="w-48 space-y-1">
          <label className="text-xs font-medium text-gray-600">Subject</label>
          <select
            name="subject_id"
            required
            defaultValue={subjects.length === 1 ? subjects[0].id : ""}
            className={inputCls}
          >
            <option value="" disabled>
              Select subject
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-32 space-y-1">
          <label className="text-xs font-medium text-gray-600">Max marks</label>
          <input
            name="max_marks"
            type="number"
            required
            min="1"
            step="any"
            placeholder="100"
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create exam"}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
