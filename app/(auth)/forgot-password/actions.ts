"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ForgotState = { error?: string; sent?: boolean } | undefined;

export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData
): Promise<ForgotState> {
  const parsed = z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .safeParse(formData.get("email") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const h = await headers();
  const host = h.get("host");
  const origin =
    h.get("origin") ??
    (host ? `${host.startsWith("localhost") ? "http" : "https"}://${host}` : "");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  if (error) {
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return { error: "Too many requests. Please wait a few minutes and try again." };
    }
    console.error("resetPasswordForEmail failed:", error.message);
  }

  // Same message whether or not the account exists, so emails can't be probed.
  return { sent: true };
}
