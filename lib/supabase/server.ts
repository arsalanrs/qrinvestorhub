import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function projectRefFromUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

function projectRefFromJwt(jwt?: string): string | null {
  if (!jwt) return null;
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8')) as { ref?: string };
    return payload.ref ?? null;
  } catch {
    return null;
  }
}

/** Server-side API routes: prefer service role when it matches the configured project URL. */
export function createSupabaseApiClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const urlRef = projectRefFromUrl(url);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceRef = projectRefFromJwt(serviceKey);

  if (serviceKey && serviceRef && urlRef && serviceRef === urlRef) {
    return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  if (serviceKey && serviceRef && urlRef && serviceRef !== urlRef) {
    console.warn(
      `[supabase] SUPABASE_SERVICE_ROLE_KEY is for project "${serviceRef}" but NEXT_PUBLIC_SUPABASE_URL is "${urlRef}". Using anon key for API writes. Update the service role key in Supabase → Settings → API.`
    );
  }

  return createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
};

export const createSupabaseAdminClient = () => createSupabaseApiClient();
