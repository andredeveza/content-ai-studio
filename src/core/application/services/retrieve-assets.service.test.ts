import { describe, expect, it } from "vitest";
import { RetrieveAssetsService } from "@/core/application/services/retrieve-assets.service";
import type { Asset, AssetAnalysisPatch, NewAsset } from "@/core/domain/asset/asset";
import type { AssetRepository } from "@/core/domain/ports/asset-repository";
import type { StoragePort, UploadInput } from "@/core/domain/ports/storage";

const CLIENT_ID = "22222222-2222-4222-8222-222222222222";

function makeAsset(overrides: Partial<Asset>): Asset {
  const now = "2026-01-01T00:00:00.000Z";
  return {
    id: "asset-1",
    orgId: "org-1",
    clientId: CLIENT_ID,
    path: `${CLIENT_ID}/foto.jpg`,
    mime: "image/jpeg",
    kind: "image",
    status: "analyzed",
    width: 1080,
    height: 1350,
    dominantColor: "#101010",
    luminanceTop: 0.2,
    luminanceMid: 0.5,
    luminanceBottom: 0.2,
    terms: [],
    excerpts: [],
    family: null,
    error: null,
    analyzedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

class FakeAssetRepository implements AssetRepository {
  constructor(private readonly assets: Asset[]) {}
  async create(_input: NewAsset): Promise<Asset> {
    throw new Error("não usado neste teste");
  }
  async findById(): Promise<Asset | null> {
    throw new Error("não usado neste teste");
  }
  async listAnalyzedImagesByClient(clientId: string): Promise<Asset[]> {
    return this.assets.filter((asset) => asset.clientId === clientId);
  }
  async markAnalyzed(_assetId: string, _patch: AssetAnalysisPatch): Promise<Asset | null> {
    throw new Error("não usado neste teste");
  }
  async markFailed(): Promise<Asset | null> {
    throw new Error("não usado neste teste");
  }
}

class FakeStorage implements StoragePort {
  async upload(input: UploadInput): Promise<{ path: string; publicUrl: string }> {
    return { path: input.path, publicUrl: `https://storage.local/assets/${input.path}` };
  }
  async remove(): Promise<void> {}
  getPublicUrl(path: string): string {
    return `https://storage.local/assets/${path}`;
  }
  async download(): Promise<Buffer> {
    return Buffer.from("");
  }
}

describe("RetrieveAssetsService (bloco 7) — RetrievalPort de produção", () => {
  it("retorna null quando o cliente não tem nenhuma imagem analisada", async () => {
    const service = new RetrieveAssetsService(new FakeAssetRepository([]), new FakeStorage());
    const result = await service.findBestAsset({
      clientId: CLIENT_ID,
      theme: "grãos de café especial",
      titleBand: "bottom",
      usedAssetIds: [],
    });
    expect(result).toBeNull();
  });

  it("escolhe a imagem com maior score total entre os candidatos", async () => {
    const bomAspecto = makeAsset({
      id: "bom",
      path: `${CLIENT_ID}/bom.jpg`,
      width: 1080,
      height: 1350,
      luminanceBottom: 0.1,
      terms: ["cafe"],
    });
    const aspectoRuim = makeAsset({
      id: "ruim",
      path: `${CLIENT_ID}/ruim.jpg`,
      width: 1080,
      height: 400,
      luminanceBottom: 0.1,
      terms: ["cafe"],
    });
    const service = new RetrieveAssetsService(new FakeAssetRepository([bomAspecto, aspectoRuim]), new FakeStorage());

    const result = await service.findBestAsset({
      clientId: CLIENT_ID,
      theme: "cafe especial",
      titleBand: "bottom",
      usedAssetIds: [],
    });

    expect(result?.assetId).toBe("bom");
    expect(result?.url).toContain("bom.jpg");
  });

  it("retorna null quando nenhum candidato passa do threshold (imagem clara demais)", async () => {
    const claraDemais = makeAsset({ luminanceBottom: 0.95, luminanceTop: 0.95, terms: [] });
    const service = new RetrieveAssetsService(new FakeAssetRepository([claraDemais]), new FakeStorage());

    const result = await service.findBestAsset({
      clientId: CLIENT_ID,
      theme: "tema qualquer",
      titleBand: "bottom",
      usedAssetIds: [],
    });

    expect(result).toBeNull();
  });

  it("aplica a penalidade de reuso e devolve a luminância da faixa certa", async () => {
    const asset = makeAsset({ id: "usado", luminanceTop: 0.1, luminanceBottom: 0.6, terms: ["cafe"] });
    const service = new RetrieveAssetsService(new FakeAssetRepository([asset]), new FakeStorage());

    const semUso = await service.findBestAsset({
      clientId: CLIENT_ID,
      theme: "cafe",
      titleBand: "top",
      usedAssetIds: [],
    });
    const comUso = await service.findBestAsset({
      clientId: CLIENT_ID,
      theme: "cafe",
      titleBand: "top",
      usedAssetIds: ["usado"],
    });

    expect(semUso?.luminanceAtBand).toBeCloseTo(0.1, 10);
    expect(semUso && comUso && semUso.score - comUso.score).toBeCloseTo(0.12, 10);
  });

  it("ignora candidatos sem dimensão ou luminância da faixa (ainda não totalmente analisados)", async () => {
    const incompleto = makeAsset({ width: null });
    const service = new RetrieveAssetsService(new FakeAssetRepository([incompleto]), new FakeStorage());

    const result = await service.findBestAsset({
      clientId: CLIENT_ID,
      theme: "tema",
      titleBand: "bottom",
      usedAssetIds: [],
    });

    expect(result).toBeNull();
  });
});
