import "server-only";
import { createAdminClient } from "@/infra/db/supabase/admin";
import { SupabaseProjectRepository } from "@/infra/db/supabase/repositories/project-repository";
import { SupabasePostRepository } from "@/infra/db/supabase/repositories/post-repository";

// Bloco 10 — mesmo raciocínio de infra/editor/bootstrap.ts: service_role,
// autorização explícita nos use-cases via org_id.
export function getAgendaRepositories() {
  const db = createAdminClient();
  return {
    projects: new SupabaseProjectRepository(db),
    posts: new SupabasePostRepository(db),
  };
}
