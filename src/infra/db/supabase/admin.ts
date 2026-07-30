import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import type { Database } from "@/infra/db/supabase/types";

// Client com service_role — só server-side, nunca importar de código que
// roda no browser. Ignora RLS: use apenas em jobs/admin de confiança.
export function createAdminClient() {
  return createSupabaseClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
