import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type SessionResult = {
  response: NextResponse;
  user: User | null;
};

/**
 * Refreshes the Supabase auth session for a request/response pair inside
 * the proxy (Next.js middleware). Mirrors the official `@supabase/ssr`
 * middleware pattern: reads cookies from the incoming request and mirrors
 * any refreshed cookies onto both the request (for downstream server
 * components) and the outgoing response (so the browser gets them too).
 */
export async function updateSupabaseSession(
  request: NextRequest,
): Promise<SessionResult> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return { response, user: null };
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // IMPORTANT: getUser() (not getSession()) revalidates the JWT against
  // Supabase Auth on every request, which is required for a trustworthy
  // server-side auth check.
  const { data } = await supabase.auth.getUser();

  return { response, user: data.user };
}
