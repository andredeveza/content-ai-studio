import { randomUUID } from "node:crypto";
import { SiteImportService } from "@/core/application/services/site-import.service";
import { IngestAssetUseCase } from "@/core/application/use-cases/ingest-asset";
import { AnalyzeAssetUseCase } from "@/core/application/use-cases/analyze-asset";
import type { Asset } from "@/core/domain/asset/asset";
import type { AppError } from "@/shared/errors";
import { ok, type Result } from "@/shared/result";
import { logger } from "@/shared/logger";

export interface ImportSiteInput {
  readonly orgId: string;
  readonly clientId: string;
  readonly userId: string;
  readonly url: string;
}

export interface ImportSiteResult {
  readonly sourceUrl: string;
  readonly suggestedText: string | null;
  readonly suggestedColor: string | null;
  // Presente só quando um logo/favicon foi encontrado e ingerido com
  // sucesso — sobe status "review" no sentido do README (nunca aplicado
  // ao Brand Kit sem o usuário revisar na tela).
  readonly ingestedLogo: Asset | null;
}

// README, "Importar acervo a partir do site do cliente", passos 1-2-5-6
// nesta ordem: fetch (SiteImportService), extrai identidade (cor/texto),
// ingere o logo encontrado no pipeline normal do acervo — sempre em
// tela de revisão (ADENDO-02, correção 2), nunca aplicado direto.
export class ImportSiteUseCase {
  constructor(
    private readonly ingestAsset: IngestAssetUseCase,
    private readonly analyzeAsset: AnalyzeAssetUseCase,
    private readonly siteImport: SiteImportService = new SiteImportService(),
  ) {}

  async execute(input: ImportSiteInput): Promise<Result<ImportSiteResult, AppError>> {
    const analysis = await this.siteImport.analyze(input.url);
    if (!analysis.ok) return analysis;

    const { sourceUrl, suggestedText, suggestedColor, logo } = analysis.value;
    let ingestedLogo: Asset | null = null;

    if (logo) {
      const ingested = await this.ingestAsset.execute({
        orgId: input.orgId,
        clientId: input.clientId,
        key: randomUUID(),
        filename: `site-logo.${logo.contentType.includes("png") ? "png" : logo.contentType.includes("svg") ? "svg" : "jpg"}`,
        mime: logo.contentType,
        file: logo.bytes,
        sourceUrl,
        importedBy: input.userId,
      });

      if (ingested.ok) {
        const analyzed = await this.analyzeAsset.execute(input.orgId, ingested.value.id);
        if (analyzed.ok) {
          ingestedLogo = analyzed.value;
        } else {
          logger.warn("Falha ao analisar logo importado do site — asset fica pending", {
            assetId: ingested.value.id,
            error: analyzed.error.message,
          });
          ingestedLogo = ingested.value;
        }
      } else {
        logger.warn("Falha ao ingerir logo importado do site", { sourceUrl, error: ingested.error.message });
      }
    }

    return ok({ sourceUrl, suggestedText, suggestedColor, ingestedLogo });
  }
}
