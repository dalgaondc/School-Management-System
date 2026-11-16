"use client";

import { useActionState, useEffect, useRef } from "react";
import { classLabel, type ClassOption } from "@/lib/format";
import type { FormState } from "./actions";

const selectCls =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

export function AssignmentForm({
  action,
  teachers,
  classes,
  subjects,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  teachers: { id: string; full_name: string }[];
  classes: ClassOption[];
  subjects: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56 space-y-1">
          <label className="text-xs font-medium text-gray-600">Teacher</label>
          <select name="teacher_id" required defaultValue="" className={selectCls}>
            <option value="" disabled>
              Select teacher
            </option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-56 space-y-1">
          <label className="text-xs font-medium text-gray-600">Class</label>
          <select name="class_id" required defaultValue="" className={selectCls}>
            <option value="" disabled>
              Select class
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {classLabel(c)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-48 space-y-1">
          <label className="text-xs font-medium text-gray-600">Subject</label>
          <select name="subject_id" required defaultValue="" className={selectCls}>
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
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? "Assigning..." : "Assign"}
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
