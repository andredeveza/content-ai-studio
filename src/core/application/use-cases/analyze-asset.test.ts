import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { AnalyzeAssetUseCase } from "@/core/application/use-cases/analyze-asset";
import type { Asset, AssetAnalysisPatch, NewAsset } from "@/core/domain/asset/asset";
import type { AssetRepository } from "@/core/domain/ports/asset-repository";
import type { AssetEmbeddingRepository, EmbeddingKind, NearestAsset } from "@/core/domain/ports/asset-embedding-repository";
import type { StoragePort, UploadInput } from "@/core/domain/ports/storage";
import type { AIContext, TextEmbedder } from "@/core/domain/ports/ai-text-generator";
import type { EmbedInput, EmbedOutput } from "@/core/domain/ports/ai-provider";
import { ExternalServiceError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CLIENT_ID = "22222222-2222-4222-8222-222222222222";

function baseAsset(overrides: Partial<Asset>): Asset {
  const now = "2026-01-01T00:00:00.000Z";
  return {
    id: "asset-1",
    orgId: ORG_ID,
    clientId: CLIENT_ID,
    path: `${ORG_ID}/${CLIENT_ID}/upload-1/foto-grao-especial.jpg`,
    mime: "image/jpeg",
    kind: "image",
    status: "pending",
    width: null,
    height: null,
    dominantColor: null,
    luminanceTop: null,
    luminanceMid: null,
    luminanceBottom: null,
    terms: [],
    excerpts: [],
    family: null,
    error: null,
    analyzedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

class FakeAssetRepository implements AssetRepository {
  constructor(private asset: Asset) {}
  readonly analyzedPatches: AssetAnalysisPatch[] = [];
  readonly failedErrors: string[] = [];

  async create(_input: NewAsset): Promise<Asset> {
    throw new Error("não usado neste teste");
  }
  async findById(orgId: string, assetId: string): Promise<Asset | null> {
    return orgId === this.asset.orgId && assetId === this.asset.id ? this.asset : null;
  }
  async listAnalyzedImagesByClient(): Promise<Asset[]> {
    throw new Error("não usado neste teste");
  }
  async markAnalyzed(assetId: string, patch: AssetAnalysisPatch): Promise<Asset | null> {
    this.analyzedPatches.push(patch);
    this.asset = { ...this.asset, status: "analyzed", ...patch } as Asset;
    return this.asset;
  }
  async markFailed(assetId: string, error: string): Promise<Asset | null> {
    this.failedErrors.push(error);
    this.asset = { ...this.asset, status: "failed", error };
    return this.asset;
  }
}

class FakeAssetEmbeddingRepository implements AssetEmbeddingRepository {
  readonly created: { assetId: string; kind: EmbeddingKind; embedding: readonly number[] }[] = [];
  async create(assetId: string, kind: EmbeddingKind, embedding: readonly number[]): Promise<void> {
    this.created.push({ assetId, kind, embedding });
  }
  async findNearest(): Promise<NearestAsset[]> {
    return [];
  }
}

class FakeStorage implements StoragePort {
  constructor(private readonly buffer: Buffer) {}
  async upload(input: UploadInput): Promise<{ path: string; publicUrl: string }> {
    return { path: input.path, publicUrl: `https://storage.local/assets/${input.path}` };
  }
  async remove(): Promise<void> {}
  getPublicUrl(path: string): string {
    return `https://storage.local/assets/${path}`;
  }
  async download(): Promise<Buffer> {
    return this.buffer;
  }
}

class FailingEmbedder implements TextEmbedder {
  async embed(_input: EmbedInput, _ctx: AIContext): Promise<Result<EmbedOutput, AppError>> {
    return err(new ExternalServiceError("Hugging Face desligado por feature flag.", "huggingface"));
  }
}

class WorkingEmbedder implements TextEmbedder {
  async embed(_input: EmbedInput, _ctx: AIContext): Promise<Result<EmbedOutput, AppError>> {
    return ok({ embedding: new Array(384).fill(0.01), model: "fake-embed-model" });
  }
}

describe("AnalyzeAssetUseCase (bloco 7)", () => {
  it("analisa imagem: luminância, cor dominante e tags do nome do arquivo", async () => {
    const buffer = await sharp({
      create: { width: 40, height: 40, channels: 3, background: { r: 10, g: 20, b: 200 } },
    })
      .png()
      .toBuffer();

    const assets = new FakeAssetRepository(baseAsset({}));
    const useCase = new AnalyzeAssetUseCase(assets, new FakeAssetEmbeddingRepository(), new FakeStorage(buffer));

    const result = await useCase.execute(ORG_ID, "asset-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.width).toBe(40);
    expect(result.value.height).toBe(40);
    expect(result.value.dominantColor).toMatch(/^#[0-9a-f]{6}$/i);
    expect(result.value.terms).toContain("foto");
    expect(result.value.terms).toContain("grao");
    expect(result.value.status).toBe("analyzed");
  });

  it("analisa fonte: deriva a família do nome do arquivo", async () => {
    const assets = new FakeAssetRepository(
      baseAsset({ kind: "font", mime: "font/ttf", path: `${ORG_ID}/${CLIENT_ID}/upload-2/Marca-Bold.ttf` }),
    );
    const useCase = new AnalyzeAssetUseCase(assets, new FakeAssetEmbeddingRepository(), new FakeStorage(Buffer.from("")));

    const result = await useCase.execute(ORG_ID, "asset-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.family).toBe("acervo-marca-bold");
  });

  it("analisa PDF e indexa embedding semântico dos trechos quando o embedder funciona", async () => {
    const { default: puppeteer } = await import("puppeteer");
    const browser = await puppeteer.launch({ headless: true });
    let pdfBuffer: Buffer;
    try {
      const page = await browser.newPage();
      await page.setContent(`
        <html><body style="font-size:20px">
          <p>Cafe especial cafe grao colheita direta produtor cafe especial.</p>
          <p>${"Texto de enchimento para o excerto ficar dentro do intervalo esperado. ".repeat(2)}</p>
        </body></html>
      `);
      pdfBuffer = Buffer.from(await page.pdf({ format: "a4" }));
    } finally {
      await browser.close();
    }

    const assets = new FakeAssetRepository(
      baseAsset({ kind: "pdf", mime: "application/pdf", path: `${ORG_ID}/${CLIENT_ID}/upload-3/catalogo.pdf` }),
    );
    const embeddings = new FakeAssetEmbeddingRepository();
    const useCase = new AnalyzeAssetUseCase(
      assets,
      embeddings,
      new FakeStorage(pdfBuffer),
      new WorkingEmbedder(),
    );

    const result = await useCase.execute(ORG_ID, "asset-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.terms).toContain("cafe");
    expect(result.value.excerpts.length).toBeGreaterThan(0);
    expect(embeddings.created).toHaveLength(1);
    expect(embeddings.created[0]?.kind).toBe("semantic");
    expect(embeddings.created[0]?.embedding).toHaveLength(384);
  }, 30_000);

  it("marca failed e propaga erro quando o download falha", async () => {
    class ThrowingStorage extends FakeStorage {
      override async download(): Promise<Buffer> {
        throw new Error("bucket indisponível");
      }
    }
    const assets = new FakeAssetRepository(baseAsset({}));
    const useCase = new AnalyzeAssetUseCase(assets, new FakeAssetEmbeddingRepository(), new ThrowingStorage(Buffer.from("")));

    const result = await useCase.execute(ORG_ID, "asset-1");
    expect(result.ok).toBe(false);
    expect(assets.failedErrors).toHaveLength(1);
  });

  it("não quebra a análise quando o embedder falha (Hugging Face desligado)", async () => {
    // Reusa o branch de fonte (não depende de PDF real) só pra garantir
    // que passar um embedder que sempre falha não é usado fora do
    // branch de PDF e não afeta o resultado.
    const assets = new FakeAssetRepository(
      baseAsset({ kind: "font", mime: "font/ttf", path: `${ORG_ID}/${CLIENT_ID}/upload-4/Outra-Fonte.otf` }),
    );
    const useCase = new AnalyzeAssetUseCase(
      assets,
      new FakeAssetEmbeddingRepository(),
      new FakeStorage(Buffer.from("")),
      new FailingEmbedder(),
    );

    const result = await useCase.execute(ORG_ID, "asset-1");
    expect(result.ok).toBe(true);
  });
});
