import "server-only";
import { createAdminClient } from "@/infra/db/supabase/admin";
import { SupabaseAssetRepository } from "@/infra/db/supabase/repositories/asset-repository";
import { SupabaseAssetEmbeddingRepository } from "@/infra/db/supabase/repositories/asset-embedding-repository";
import { SupabaseStorage } from "@/infra/storage/supabase-storage";

// Acervo (ADENDO-01/ADENDO-02) roda com service_role — mesmo raciocínio
// de infra/editor/bootstrap.ts: autorização é feita explicitamente nos
// use-cases via org_id, não por RLS.
//
// Só repositórios aqui de propósito — nada de AnalyzeAssetUseCase (que
// puxa pdf-extraction.service.ts -> pacote `pdf-parse`) neste arquivo.
// Server Components (page.tsx) importam este módulo pra listar/pontuar
// o acervo; se ele importasse os use-cases de análise também, o
// `pdf-parse` entraria no grafo de módulos do RSC e quebra a build com
// "Object.defineProperty called on non-object" ao carregar (só
// descoberto rodando de verdade — pdf-parse não é compatível com o
// bundler de Server Components). Use-cases de ingestão/análise ficam em
// infra/acervo/ingestion-bootstrap.ts, importado só por server actions.
export function getAcervoRepositories() {
  const db = createAdminClient();
  return {
    assets: new SupabaseAssetRepository(db),
    assetEmbeddings: new SupabaseAssetEmbeddingRepository(db),
    assetsStorage: new SupabaseStorage(db, "assets"),
  };
}
