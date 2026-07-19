import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Reads/writes auth cookies via `next/headers`.
 *
 * Note: cookie writes silently no-op when called from a Server Component
 * (Next.js only allows cookie mutation from Server Actions and Route
 * Handlers). Session refresh for those contexts is handled by the proxy
 * (`src/lib/supabase/middleware.ts`).
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database> | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options as CookieOptions);
          }
        } catch {
          // Called from a Server Component: cookies can't be set here.
          // The proxy refreshes the session cookie on the request instead.
        }
      },
    },
  });
}
