"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: boolean } | undefined;

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "One of the fields is too long.")
    .transform((v) => (v === "" ? null : v));

const schema = z.object({
  full_name: z.string().trim().min(1, "Student name is required.").max(100),
  roll_no: optional(20),
  class_id: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[0-9a-f-]{36}$/i.test(v), "Invalid class.")
    .transform((v) => (v === "" ? null : v)),
  guardian_name: optional(100),
  guardian_phone: optional(20),
});

function parse(formData: FormData) {
  const get = (k: string) => formData.get(k) ?? "";
  return schema.safeParse({
    full_name: get("full_name"),
    roll_no: get("roll_no"),
    class_id: get("class_id"),
    guardian_name: get("guardian_name"),
    guardian_phone: get("guardian_phone"),
  });
}

export async function createStudent(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole("admin");
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("students").insert(parsed.data);
  if (error) return { error: "Could not add the student." };

  revalidatePath("/admin/students");
  return { success: true };
}

export async function updateStudent(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing student id." };
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("students").update(parsed.data).eq("id", id);
  if (error) return { error: "Could not update the student." };

  revalidatePath("/admin/students");
  return { success: true };
}

export async function deleteStudent(formData: FormData): Promise<void> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw new Error("Could not delete the student.");

  revalidatePath("/admin/students");
}
