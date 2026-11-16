"use client";

import { useState } from "react";
import { DeleteButton } from "@/components/delete-button";
import { SubjectForm } from "./subject-form";
import { deleteSubject, updateSubject } from "./actions";

export function SubjectRow({ subject }: { subject: { id: string; name: string } }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr className="border-t border-gray-200 bg-gray-50">
        <td colSpan={2} className="px-4 py-3">
          <SubjectForm
            action={updateSubject}
            initial={subject}
            submitLabel="Save"
            onDone={() => setEditing(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-200">
      <td className="px-4 py-3 text-sm font-medium">{subject.name}</td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
          >
            Edit
          </button>
          <DeleteButton
            action={deleteSubject}
            id={subject.id}
            message={`Delete ${subject.name}? Teacher assignments for this subject will also be removed.`}
          />
        </div>
      </td>
    </tr>
  );
}
