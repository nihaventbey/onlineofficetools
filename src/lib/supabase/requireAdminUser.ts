import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-side admin check for use in layouts/pages/actions. Returns the
 * authenticated admin user, or `null` when there is no session, the user
 * isn't an admin, or Supabase isn't configured.
 *
 * This re-validates the JWT with Supabase Auth (via `getUser()`), it does
 * not just trust the session cookie.
 */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user || user.app_metadata?.role !== "admin") {
    return null;
  }

  return user;
}
