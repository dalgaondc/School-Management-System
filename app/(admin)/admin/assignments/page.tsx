import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { classLabel, type ClassOption } from "@/lib/format";
import { DeleteButton } from "@/components/delete-button";
import { AssignmentForm } from "./assignment-form";
import { createAssignment, deleteAssignment } from "./actions";

type AssignmentRow = {
  id: string;
  profiles: { full_name: string } | null;
  classes: { name: string; section: string | null; academic_year: string } | null;
  subjects: { name: string } | null;
};

export default async function AssignmentsPage() {
  const supabase = await createClient();

  const [teachersRes, classesRes, subjectsRes, assignmentsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("role", "teacher").order("full_name"),
    supabase
      .from("classes")
      .select("id, name, section, academic_year")
      .order("academic_year", { ascending: false })
      .order("name")
      .order("section"),
    supabase.from("subjects").select("id, name").order("name"),
    supabase
      .from("teacher_assignments")
      .select("id, profiles(full_name), classes(name, section, academic_year), subjects(name)"),
  ]);

  const teachers = (teachersRes.data ?? []) as { id: string; full_name: string }[];
  const classes = (classesRes.data ?? []) as ClassOption[];
  const subjects = (subjectsRes.data ?? []) as { id: string; name: string }[];
  const assignments = ((assignmentsRes.data ?? []) as unknown as AssignmentRow[]).sort(
    (a, b) =>
      (a.profiles?.full_name ?? "").localeCompare(b.profiles?.full_name ?? "") ||
      (a.classes?.name ?? "").localeCompare(b.classes?.name ?? "")
  );

  const missing: { label: string; href: string }[] = [];
  if (teachers.length === 0) missing.push({ label: "teachers", href: "/admin/teachers" });
  if (classes.length === 0) missing.push({ label: "classes", href: "/admin/classes" });
  if (subjects.length === 0) missing.push({ label: "subjects", href: "/admin/subjects" });

  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-2xl font-semibold">Teacher assignments</h1>

      <div className="mb-8 rounded-xl border border-gray-200 p-4">
        <p className="mb-3 text-sm font-medium">Assign a teacher to a class and subject</p>
        {missing.length > 0 ? (
          <p className="text-sm text-gray-600">
            You need to add{" "}
            {missing.map((m, i) => (
              <span key={m.href}>
                {i > 0 && (i === missing.length - 1 ? " and " : ", ")}
                <Link href={m.href} className="underline">
                  {m.label}
                </Link>
              </span>
            ))}{" "}
            first.
          </p>
        ) : (
          <AssignmentForm
            action={createAssignment}
            teachers={teachers}
            classes={classes}
            subjects={subjects}
          />
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Teacher</th>
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} className="border-t border-gray-200">
                <td className="px-4 py-3 text-sm font-medium">{a.profiles?.full_name}</td>
                <td className="px-4 py-3 text-sm">
                  {a.classes ? classLabel(a.classes) : "-"}
                </td>
                <td className="px-4 py-3 text-sm">{a.subjects?.name}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <DeleteButton
                      action={deleteAssignment}
                      id={a.id}
                      message="Remove this assignment? The teacher will lose access to this class."
                    />
                  </div>
                </td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  No assignments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
