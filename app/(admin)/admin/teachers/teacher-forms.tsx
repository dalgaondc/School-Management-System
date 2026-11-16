"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "./actions";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const inputCls =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900";
const primaryBtn =
  "rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60";
const secondaryBtn =
  "rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100";

function useFormAction(action: Action, onDone?: () => void) {
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

  return { state, formAction, pending, formRef };
}

export function AddTeacherForm({ action }: { action: Action }) {
  const { state, formAction, pending, formRef } = useFormAction(action);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-52 space-y-1">
          <label className="text-xs font-medium text-gray-600">Full name</label>
          <input name="full_name" required placeholder="Anita Sharma" className={inputCls} />
        </div>
        <div className="w-60 space-y-1">
          <label className="text-xs font-medium text-gray-600">Email</label>
          <input
            name="email"
            type="email"
            required
            placeholder="anita@school.edu"
            className={inputCls}
          />
        </div>
        <div className="w-52 space-y-1">
          <label className="text-xs font-medium text-gray-600">Temporary password</label>
          <input
            name="password"
            type="text"
            required
            minLength={8}
            autoComplete="off"
            placeholder="At least 8 characters"
            className={inputCls}
          />
        </div>
        <button type="submit" disabled={pending} className={primaryBtn}>
          {pending ? "Creating..." : "Add teacher"}
        </button>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-green-700">
          Teacher added. Share the email and temporary password with them.
        </p>
      )}
    </form>
  );
}

export function EditNameForm({
  action,
  id,
  name,
  onDone,
}: {
  action: Action;
  id: string;
  name: string;
  onDone: () => void;
}) {
  const { state, formAction, pending, formRef } = useFormAction(action, onDone);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={id} />
      <div className="w-64 space-y-1">
        <label className="text-xs font-medium text-gray-600">Full name</label>
        <input name="full_name" required defaultValue={name} className={inputCls} />
      </div>
      <button type="submit" disabled={pending} className={primaryBtn}>
        {pending ? "Saving..." : "Save"}
      </button>
      <button type="button" onClick={onDone} className={secondaryBtn}>
        Cancel
      </button>
      {state?.error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function PasswordForm({
  action,
  id,
  onDone,
}: {
  action: Action;
  id: string;
  onDone: () => void;
}) {
  const { state, formAction, pending, formRef } = useFormAction(action, onDone);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={id} />
      <div className="w-64 space-y-1">
        <label className="text-xs font-medium text-gray-600">New password</label>
        <input
          name="password"
          type="text"
          required
          minLength={8}
          autoComplete="off"
          placeholder="At least 8 characters"
          className={inputCls}
        />
      </div>
      <button type="submit" disabled={pending} className={primaryBtn}>
        {pending ? "Saving..." : "Set password"}
      </button>
      <button type="button" onClick={onDone} className={secondaryBtn}>
        Cancel
      </button>
      {state?.error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
