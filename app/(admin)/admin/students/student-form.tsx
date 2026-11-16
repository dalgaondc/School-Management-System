"use client";

import { useActionState, useEffect, useRef } from "react";
import { classLabel, type ClassOption } from "@/lib/format";
import type { FormState } from "./actions";

export type StudentData = {
  id: string;
  full_name: string;
  roll_no: string | null;
  class_id: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
};

const inputCls =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

export function StudentForm({
  action,
  classes,
  initial,
  defaultClassId,
  submitLabel,
  onDone,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  classes: ClassOption[];
  initial?: StudentData;
  defaultClassId?: string;
  submitLabel: string;
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onDone?.();
    }
  }, [state, onDone]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56 space-y-1">
          <label className="text-xs font-medium text-gray-600">Student name</label>
          <input
            name="full_name"
            required
            defaultValue={initial?.full_name}
            placeholder="Rahul Patil"
            className={inputCls}
          />
        </div>
        <div className="w-24 space-y-1">
          <label className="text-xs font-medium text-gray-600">Roll no</label>
          <input
            name="roll_no"
            defaultValue={initial?.roll_no ?? ""}
            placeholder="12"
            className={inputCls}
          />
        </div>
        <div className="w-56 space-y-1">
          <label className="text-xs font-medium text-gray-600">Class</label>
          <select
            name="class_id"
            defaultValue={initial?.class_id ?? defaultClassId ?? ""}
            className={inputCls}
          >
            <option value="">Not assigned</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {classLabel(c)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56 space-y-1">
          <label className="text-xs font-medium text-gray-600">Guardian name</label>
          <input
            name="guardian_name"
            defaultValue={initial?.guardian_name ?? ""}
            className={inputCls}
          />
        </div>
        <div className="w-44 space-y-1">
          <label className="text-xs font-medium text-gray-600">Guardian phone</label>
          <input
            name="guardian_phone"
            type="tel"
            defaultValue={initial?.guardian_phone ?? ""}
            className={inputCls}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
