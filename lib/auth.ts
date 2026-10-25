import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "teacher";

export type CurrentProfile = {
  id: string;
  full_name: string;
  role: Role;
  email: string | undefined;
};

export function homeFor(role: Role) {
  return role === "admin" ? "/admin" : "/teacher";
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return { ...(profile as Omit<CurrentProfile, "email">), email: user.email };
}

export async function requireRole(role: Role): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== role) redirect(homeFor(profile.role));
  return profile;
}
