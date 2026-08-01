import { RETRIEVAL_SCORE_THRESHOLD } from "@/core/application/services/asset-scoring.service";
import type { AIContext, AIImageGenerator } from "@/core/domain/ports/ai-text-generator";
import type { AssetQuery, RetrievalPort } from "@/core/domain/ports/retrieval";
import type { AppError } from "@/shared/errors";
import { ok, type Result } from "@/shared/result";

export interface ResolveMediaOptions {
  // Piso de aceitação do acervo. O passe normal usa
  // RETRIEVAL_SCORE_THRESHOLD (0.5); o passe de garantia (quando nenhum
  // asset entrou no carrossel) baixa para FALLBACK_SCORE_FLOOR.
  readonly minScore?: number;
}

export interface ResolvedMedia {
  readonly url: string;
  // null quando a imagem foi gerada por IA (não veio do acervo).
  readonly assetId: string | null;
  readonly luminanceAtBand: number | null;
}

// Step "image" (60%, "+ RetrievalService antes" — README).
export class ImageService {
  constructor(
    private readonly imageGenerator: AIImageGenerator,
    private readonly retrieval: RetrievalPort,
  ) {}

  async resolveMedia(
    query: AssetQuery,
    prompt: string,
    ctx: AIContext,
    options: ResolveMediaOptions = {},
  ): Promise<Result<ResolvedMedia, AppError>> {
    const minScore = options.minScore ?? RETRIEVAL_SCORE_THRESHOLD;
    const match = await this.retrieval.findBestAsset(query);
    // `illegible` barra o match em qualquer piso: legibilidade vence
    // variedade (README, "Não remova").
    if (match && !match.illegible && match.score >= minScore) {
      return ok({ url: match.url, assetId: match.assetId, luminanceAtBand: match.luminanceAtBand });
    }

    const generated = await this.imageGenerator.generateImage({ prompt }, ctx);
    if (!generated.ok) return generated;
    return ok({ url: generated.value.imageUrl, assetId: null, luminanceAtBand: null });
  }
}
