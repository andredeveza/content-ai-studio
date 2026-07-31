import "server-only";
import { createClient } from "@/infra/db/supabase/server";

export interface CurrentSession {
  readonly userId: string;
  readonly orgId: string;
  readonly email: string;
}

// Sessão do usuário logado + org_id (README: multi-tenant por org_id). O
// middleware já garante que só chega aqui gente autenticada; isto só
// resolve o org_id pra escopar as consultas.
export async function getCurrentSession(): Promise<CurrentSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("users").select("org_id, email").eq("id", user.id).single();
  if (!profile) return null;

  return { userId: user.id, orgId: profile.org_id, email: profile.email };
}
