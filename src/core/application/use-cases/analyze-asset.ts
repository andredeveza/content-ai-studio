import { analyzeImageBuffer } from "@/core/application/services/image-analysis.service";
import { extractPdfBuffer } from "@/core/application/services/pdf-extraction.service";
import { deriveFontFamily } from "@/core/application/services/font-analysis.service";
import { filenameTags } from "@/core/application/services/text-tokens";
import type { AIContext, TextEmbedder } from "@/core/domain/ports/ai-text-generator";
import type { Asset } from "@/core/domain/asset/asset";
import type { AssetEmbeddingRepository } from "@/core/domain/ports/asset-embedding-repository";
import type { AssetRepository } from "@/core/domain/ports/asset-repository";
import type { StoragePort } from "@/core/domain/ports/storage";
import { ExternalServiceError, NotFoundError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";
import { logger } from "@/shared/logger";

function filenameFromPath(path: string): string {
  return path.split("/").pop() ?? path;
}

// Step 2 do fluxo do Acervo (README, "Extração"): baixa o arquivo
// recém-ingerido e roda o serviço certo pro `kind` — imagem
// (luminância/cor dominante), PDF (termos/trechos) ou fonte (família).
// A indexação semântica (step 3) dos trechos de PDF é best-effort: só
// roda se um `TextEmbedder` real estiver disponível (Hugging Face é
// feature-flag desligada por padrão no MVP) e nunca derruba a análise.
export class AnalyzeAssetUseCase {
  constructor(
    private readonly assets: AssetRepository,
    private readonly assetEmbeddings: AssetEmbeddingRepository,
    private readonly storage: StoragePort,
    private readonly embedder?: TextEmbedder,
  ) {}

  async execute(orgId: string, assetId: string): Promise<Result<Asset, AppError>> {
    const asset = await this.assets.findById(orgId, assetId);
    if (!asset) return err(new NotFoundError(`Asset ${assetId} não encontrado.`));

    let buffer: Buffer;
    try {
      buffer = await this.storage.download(asset.path);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      await this.assets.markFailed(assetId, message);
      return err(new ExternalServiceError(`Falha ao baixar asset ${assetId}.`, "supabase-storage", cause));
    }

    try {
      switch (asset.kind) {
        case "image": {
          const analysis = await analyzeImageBuffer(buffer);
          const updated = await this.assets.markAnalyzed(assetId, {
            width: analysis.width,
            height: analysis.height,
            dominantColor: analysis.dominantColor,
            luminanceTop: analysis.luminanceTop,
            luminanceMid: analysis.luminanceMid,
            luminanceBottom: analysis.luminanceBottom,
            terms: filenameTags(filenameFromPath(asset.path)),
          });
          if (!updated) return err(new NotFoundError(`Asset ${assetId} sumiu durante a análise.`));
          return ok(updated);
        }
        case "pdf": {
          const extraction = await extractPdfBuffer(buffer);
          const updated = await this.assets.markAnalyzed(assetId, {
            terms: extraction.terms,
            excerpts: extraction.excerpts,
          });
          if (!updated) return err(new NotFoundError(`Asset ${assetId} sumiu durante a análise.`));

          await this.indexExcerpts(orgId, assetId, extraction.excerpts);
          return ok(updated);
        }
        case "font": {
          const updated = await this.assets.markAnalyzed(assetId, {
            family: deriveFontFamily(filenameFromPath(asset.path)),
          });
          if (!updated) return err(new NotFoundError(`Asset ${assetId} sumiu durante a análise.`));
          return ok(updated);
        }
        default: {
          const exhaustive: never = asset.kind;
          throw new Error(`Kind de asset desconhecido: ${String(exhaustive)}`);
        }
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      await this.assets.markFailed(assetId, message);
      return err(new ExternalServiceError(`Falha ao analisar asset ${assetId}.`, "asset-analysis", cause));
    }
  }

  private async indexExcerpts(orgId: string, assetId: string, excerpts: readonly string[]): Promise<void> {
    if (!this.embedder || excerpts.length === 0) return;

    const ctx: AIContext = { orgId, userId: null };
    const text = excerpts.slice(0, 5).join("\n");

    const result = await this.embedder.embed({ text }, ctx);
    if (!result.ok) {
      logger.warn("Falha ao gerar embedding semântico do PDF — seguindo sem indexação", {
        assetId,
        error: result.error.message,
      });
      return;
    }

    await this.assetEmbeddings.create(assetId, "semantic", result.value.embedding, { excerptCount: excerpts.length });
  }
}
