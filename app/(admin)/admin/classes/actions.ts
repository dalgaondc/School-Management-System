"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: boolean } | undefined;

const schema = z.object({
  name: z.string().trim().min(1, "Class name is required.").max(50),
  section: z
    .string()
    .trim()
    .max(10, "Section is too long.")
    .transform((v) => (v === "" ? null : v)),
  academic_year: z.string().trim().min(1, "Academic year is required.").max(20),
});

function parse(formData: FormData) {
  return schema.safeParse({
    name: formData.get("name") ?? "",
    section: formData.get("section") ?? "",
    academic_year: formData.get("academic_year") ?? "",
  });
}

export async function createClass(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole("admin");
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("classes").insert(parsed.data);
  if (error) return { error: "Could not create the class." };

  revalidatePath("/admin/classes");
  return { success: true };
}

export async function updateClass(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const parsed = parse(formData);
  if (!id) return { error: "Missing class id." };
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("classes").update(parsed.data).eq("id", id);
  if (error) return { error: "Could not update the class." };

  revalidatePath("/admin/classes");
  return { success: true };
}

export async function deleteClass(formData: FormData): Promise<void> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) throw new Error("Could not delete the class.");

  revalidatePath("/admin/classes");
}
