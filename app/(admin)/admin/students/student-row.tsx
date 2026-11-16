"use client";

import { useState } from "react";
import { DeleteButton } from "@/components/delete-button";
import { classLabel, type ClassOption } from "@/lib/format";
import { StudentForm, type StudentData } from "./student-form";
import { deleteStudent, updateStudent } from "./actions";

export function StudentRow({
  student,
  classes,
}: {
  student: StudentData;
  classes: ClassOption[];
}) {
  const [editing, setEditing] = useState(false);
  const cls = classes.find((c) => c.id === student.class_id);

  if (editing) {
    return (
      <tr className="border-t border-gray-200 bg-gray-50">
        <td colSpan={5} className="px-4 py-3">
          <StudentForm
            action={updateStudent}
            classes={classes}
            initial={student}
            submitLabel="Save"
            onDone={() => setEditing(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-200">
      <td className="px-4 py-3 text-sm">{student.roll_no ?? "-"}</td>
      <td className="px-4 py-3 text-sm font-medium">{student.full_name}</td>
      <td className="px-4 py-3 text-sm">{cls ? classLabel(cls) : "Not assigned"}</td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {student.guardian_name ?? "-"}
        {student.guardian_phone ? ` · ${student.guardian_phone}` : ""}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
          >
            Edit
          </button>
          <DeleteButton
            action={deleteStudent}
            id={student.id}
            message={`Delete ${student.full_name}? Their attendance and grades will also be deleted.`}
          />
        </div>
      </td>
    </tr>
  );
}
