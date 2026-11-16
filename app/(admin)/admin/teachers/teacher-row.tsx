"use client";

import { useState } from "react";
import { DeleteButton } from "@/components/delete-button";
import { EditNameForm, PasswordForm } from "./teacher-forms";
import { deleteTeacher, resetTeacherPassword, updateTeacherName } from "./actions";

type Teacher = { id: string; full_name: string; email: string | null };

export function TeacherRow({ teacher }: { teacher: Teacher }) {
  const [mode, setMode] = useState<"view" | "name" | "password">("view");
  const close = () => setMode("view");

  if (mode !== "view") {
    return (
      <tr className="border-t border-gray-200 bg-gray-50">
        <td colSpan={3} className="px-4 py-3">
          {mode === "name" ? (
            <EditNameForm
              action={updateTeacherName}
              id={teacher.id}
              name={teacher.full_name}
              onDone={close}
            />
          ) : (
            <PasswordForm action={resetTeacherPassword} id={teacher.id} onDone={close} />
          )}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-200">
      <td className="px-4 py-3 text-sm font-medium">{teacher.full_name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{teacher.email ?? "-"}</td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <button
            onClick={() => setMode("name")}
            className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
          >
            Rename
          </button>
          <button
            onClick={() => setMode("password")}
            className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
          >
            Reset password
          </button>
          <DeleteButton
            action={deleteTeacher}
            id={teacher.id}
            message={`Delete ${teacher.full_name}? Their login and class assignments will be removed. Attendance and grades they entered are kept.`}
          />
        </div>
      </td>
    </tr>
  );
}
