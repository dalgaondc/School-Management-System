"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "./actions";

export function SubjectForm({
  action,
  initial,
  submitLabel,
  onDone,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: { id: string; name: string };
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
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="w-64 space-y-1">
        <label className="text-xs font-medium text-gray-600">Subject name</label>
        <input
          name="name"
          required
          placeholder="Mathematics"
          defaultValue={initial?.name}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
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

      {state?.error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
