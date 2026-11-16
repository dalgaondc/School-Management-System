"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type FormState = { error?: string; success?: boolean } | undefined;

const nameSchema = z.string().trim().min(1, "Full name is required.").max(100);
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password is too long.");

const createSchema = z.object({
  full_name: nameSchema,
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: passwordSchema,
});

// Make sure the target really is a teacher (never touch admins from these actions).
async function assertTeacher(id: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("role").eq("id", id).single();
  return data?.role === "teacher";
}

export async function createTeacher(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole("admin");

  const parsed = createSchema.safeParse({
    full_name: formData.get("full_name") ?? "",
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { full_name, email, password } = parsed.data;
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    const exists =
      error?.code === "email_exists" || /already|registered/i.test(error?.message ?? "");
    return {
      error: exists
        ? "An account with that email already exists."
        : "Could not create the account.",
    };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: data.user.id, full_name, role: "teacher" });

  if (profileError) {
    // Roll back so we don't leave a login with no profile.
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "Could not create the teacher profile." };
  }

  revalidatePath("/admin/teachers");
  return { success: true };
}

export async function updateTeacherName(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const parsed = nameSchema.safeParse(formData.get("full_name") ?? "");
  if (!id) return { error: "Missing teacher id." };
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await assertTeacher(id))) return { error: "Teacher not found." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ full_name: parsed.data })
    .eq("id", id);
  if (error) return { error: "Could not update the name." };

  revalidatePath("/admin/teachers");
  return { success: true };
}

export async function resetTeacherPassword(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const parsed = passwordSchema.safeParse(formData.get("password") ?? "");
  if (!id) return { error: "Missing teacher id." };
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await assertTeacher(id))) return { error: "Teacher not found." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, {
    password: parsed.data,
  });
  if (error) return { error: "Could not reset the password." };

  return { success: true };
}

export async function deleteTeacher(formData: FormData): Promise<void> {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (!(await assertTeacher(id))) throw new Error("Teacher not found.");

  const admin = createAdminClient();
  // Deleting the auth user cascades to profiles and teacher_assignments.
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error("Could not delete the teacher.");

  revalidatePath("/admin/teachers");
}
