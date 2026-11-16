"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Some Supabase recovery links (e.g. sent from the dashboard) arrive as
// /anything#access_token=...&type=recovery. The server cannot see the part
// after "#", so we let the browser client pick up the session, then go to
// the "set new password" page.
export function RecoveryHashHandler({ target }: { target: string }) {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token") || !hash.includes("type=recovery")) return;

    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession(); // processes the hash
      window.history.replaceState(null, "", window.location.pathname);
      if (data.session) {
        router.replace(target);
        router.refresh();
      }
    })();
  }, [router, target]);

  return null;
}
