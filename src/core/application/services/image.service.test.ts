import { describe, expect, it } from "vitest";
import { ImageService } from "@/core/application/services/image.service";
import { FALLBACK_SCORE_FLOOR, RETRIEVAL_SCORE_THRESHOLD } from "@/core/application/services/asset-scoring.service";
import type { AIContext, AIImageGenerator } from "@/core/domain/ports/ai-text-generator";
import type { ImageInput, ImageOutput } from "@/core/domain/ports/ai-provider";
import type { AssetMatch, RetrievalPort } from "@/core/domain/ports/retrieval";
import type { AppError } from "@/shared/errors";
import { ok, type Result } from "@/shared/result";

const CTX: AIContext = { orgId: "org-1", userId: null };

class FakeRetrieval implements RetrievalPort {
  constructor(private readonly result: AssetMatch | null) {}
  async findBestAsset(): Promise<AssetMatch | null> {
    return this.result;
  }
}

class FakeImageGenerator implements AIImageGenerator {
  calls = 0;
  async generateImage(_input: ImageInput, _ctx: AIContext): Promise<Result<ImageOutput, AppError>> {
    this.calls += 1;
    return ok({ imageUrl: "https://ia.example.com/gerada.png", model: "fake" });
  }
}

function match(overrides: Partial<AssetMatch> = {}): AssetMatch {
  return {
    assetId: "asset-1",
    url: "https://storage.local/foto.jpg",
    score: 0.8,
    luminanceAtBand: 0.2,
    illegible: false,
    ...overrides,
  };
}

const QUERY = { clientId: "c1", theme: "tema", titleBand: "bottom" as const, usedAssetIds: [] };

describe("ImageService — acervo primeiro, IA como fallback", () => {
  it("usa a foto do acervo quando o score passa do limite", async () => {
    const generator = new FakeImageGenerator();
    const service = new ImageService(generator, new FakeRetrieval(match()));

    const result = await service.resolveMedia(QUERY, "prompt", CTX);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.assetId).toBe("asset-1");
    expect(generator.calls).toBe(0);
  });

  it("cai na IA quando o melhor match não alcança o limite normal", async () => {
    const generator = new FakeImageGenerator();
    const service = new ImageService(generator, new FakeRetrieval(match({ score: 0.4 })));

    const result = await service.resolveMedia(QUERY, "prompt", CTX);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.assetId).toBeNull();
    expect(generator.calls).toBe(1);
  });

  // Passe de garantia: o MESMO match de 0.4 é aceito quando o carrossel
  // fecharia sem nenhuma foto do cliente (README, "Critério de pronto").
  it("com piso mais baixo, aceita um match mediano em vez de gerar por IA", async () => {
    const generator = new FakeImageGenerator();
    const service = new ImageService(generator, new FakeRetrieval(match({ score: 0.4 })));

    const result = await service.resolveMedia(QUERY, "prompt", CTX, { minScore: FALLBACK_SCORE_FLOOR });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.assetId).toBe("asset-1");
    expect(generator.calls).toBe(0);
  });

  // README: "illegible existe para que legibilidade vença variedade.
  // Não remova." Vale inclusive no passe de garantia, e mesmo com score
  // alto — título ilegível é pior que imagem genérica.
  it("nunca aceita match ilegível, nem com o piso mais baixo", async () => {
    const generator = new FakeImageGenerator();
    const service = new ImageService(generator, new FakeRetrieval(match({ score: 0.9, illegible: true })));

    const result = await service.resolveMedia(QUERY, "prompt", CTX, { minScore: FALLBACK_SCORE_FLOOR });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.assetId).toBeNull();
    expect(generator.calls).toBe(1);
  });

  it("o piso de garantia é mais baixo que o limite normal", () => {
    expect(FALLBACK_SCORE_FLOOR).toBeLessThan(RETRIEVAL_SCORE_THRESHOLD);
  });
});
