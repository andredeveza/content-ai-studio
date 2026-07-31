import "server-only";
import { getAcervoRepositories } from "@/infra/acervo/bootstrap";
import { IngestAssetUseCase } from "@/core/application/use-cases/ingest-asset";
import { AnalyzeAssetUseCase } from "@/core/application/use-cases/analyze-asset";
import { ImportSiteUseCase } from "@/core/application/use-cases/import-site";

// Separado de infra/acervo/bootstrap.ts de propósito: AnalyzeAssetUseCase
// importa pdf-extraction.service.ts (pacote `pdf-parse`), que quebra a
// build de Server Components se entrar no grafo de módulos de uma
// page.tsx — ver comentário em bootstrap.ts. Só server actions ("use
// server") importam este arquivo.
export function getIngestAssetUseCase(): IngestAssetUseCase {
  const { assets, assetsStorage } = getAcervoRepositories();
  return new IngestAssetUseCase(assets, assetsStorage);
}

export function getAnalyzeAssetUseCase(): AnalyzeAssetUseCase {
  const { assets, assetEmbeddings, assetsStorage } = getAcervoRepositories();
  // TextEmbedder fica undefined de propósito: a capability "embed" está
  // com `enabled: false` fixo em config/ai.ts (nenhum provider real a
  // implementa ainda, nem o Hugging Face) — passar o AIGateway aqui
  // sempre falharia com AllProvidersFailedError. AnalyzeAssetUseCase já
  // trata `embedder` ausente como best-effort (README, "Indexação").
  return new AnalyzeAssetUseCase(assets, assetEmbeddings, assetsStorage);
}

export function getImportSiteUseCase(): ImportSiteUseCase {
  return new ImportSiteUseCase(getIngestAssetUseCase(), getAnalyzeAssetUseCase());
}
