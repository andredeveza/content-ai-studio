import "server-only";
import { createAdminClient } from "@/infra/db/supabase/admin";
import { SupabaseProjectRepository } from "@/infra/db/supabase/repositories/project-repository";
import { SupabaseSlideRepository } from "@/infra/db/supabase/repositories/slide-repository";
import { SupabaseClientRepository } from "@/infra/db/supabase/repositories/client-repository";
import { SupabaseBrandKitRepository } from "@/infra/db/supabase/repositories/brand-kit-repository";
import { SupabaseMediaRepository } from "@/infra/db/supabase/repositories/media-repository";
import { SupabaseStorage } from "@/infra/storage/supabase-storage";

// Repositórios do Editor (bloco 8) e da Exportação (bloco 9) rodam com
// service_role — mesmo raciocínio do PipelineWorker (bloco 6): a
// autorização é feita explicitamente pelos use-cases (checagem de
// org_id), não por RLS.
export function getEditorRepositories() {
  const db = createAdminClient();
  return {
    projects: new SupabaseProjectRepository(db),
    slides: new SupabaseSlideRepository(db),
    clients: new SupabaseClientRepository(db),
    brandKits: new SupabaseBrandKitRepository(db),
    media: new SupabaseMediaRepository(db),
    mediaStorage: new SupabaseStorage(db, "media"),
    exportStorage: new SupabaseStorage(db, "exports"),
    brandLogoStorage: new SupabaseStorage(db, "brand-logos"),
  };
}
