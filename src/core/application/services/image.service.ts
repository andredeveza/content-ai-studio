import type { AIContext, AIImageGenerator } from "@/core/domain/ports/ai-text-generator";
import type { RetrievalPort } from "@/core/domain/ports/retrieval";
import type { AppError } from "@/shared/errors";
import { ok, type Result } from "@/shared/result";

// Mesmo limite mencionado no README ("Acervo / RAG"): se `total` (score
// do RetrieveAssets) passa do limite, usa a foto real; senão, gera com
// IA. O valor exato da fórmula chega no bloco 7 — aqui só o contrato.
const RETRIEVAL_SCORE_THRESHOLD = 0.5;

// Step "image" (60%, "+ RetrievalService antes" — README).
export class ImageService {
  constructor(
    private readonly imageGenerator: AIImageGenerator,
    private readonly retrieval: RetrievalPort,
  ) {}

  async resolveMediaUrl(
    clientId: string,
    prompt: string,
    brief: string,
    ctx: AIContext,
  ): Promise<Result<string, AppError>> {
    const match = await this.retrieval.findBestAsset(clientId, brief);
    if (match && match.score >= RETRIEVAL_SCORE_THRESHOLD) {
      return ok(match.url);
    }

    const generated = await this.imageGenerator.generateImage({ prompt }, ctx);
    if (!generated.ok) return generated;
    return ok(generated.value.imageUrl);
  }
}
