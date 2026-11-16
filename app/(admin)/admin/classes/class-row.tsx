"use client";

import { useState } from "react";
import { DeleteButton } from "@/components/delete-button";
import { ClassForm } from "./class-form";
import { deleteClass, updateClass } from "./actions";

type ClassData = {
  id: string;
  name: string;
  section: string | null;
  academic_year: string;
};

export function ClassRow({ cls }: { cls: ClassData }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr className="border-t border-gray-200 bg-gray-50">
        <td colSpan={4} className="px-4 py-3">
          <ClassForm
            action={updateClass}
            initial={cls}
            submitLabel="Save"
            onDone={() => setEditing(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-200">
      <td className="px-4 py-3 text-sm font-medium">{cls.name}</td>
      <td className="px-4 py-3 text-sm">{cls.section ?? "-"}</td>
      <td className="px-4 py-3 text-sm">{cls.academic_year}</td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
          >
            Edit
          </button>
          <DeleteButton
            action={deleteClass}
            id={cls.id}
            message={`Delete ${cls.name}${cls.section ? " " + cls.section : ""}? This also deletes its attendance, exams, grades and teacher assignments. Students stay but become unassigned.`}
          />
        </div>
      </td>
    </tr>
  );
}
