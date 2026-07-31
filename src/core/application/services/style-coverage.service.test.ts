import { describe, expect, it } from "vitest";
import { StyleCoverageService } from "@/core/application/services/style-coverage.service";
import type { Asset } from "@/core/domain/asset/asset";
import type { AssetRepository } from "@/core/domain/ports/asset-repository";
import type { BrandKit } from "@/core/domain/brandkit/brand-kit";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CLIENT_ID = "22222222-2222-4222-8222-222222222222";

class FakeAssetRepository implements AssetRepository {
  constructor(private readonly rows: Asset[]) {}
  async create(): Promise<Asset> {
    throw new Error("não usado neste teste");
  }
  async findById(): Promise<Asset | null> {
    throw new Error("não usado neste teste");
  }
  async listAnalyzedImagesByClient(): Promise<Asset[]> {
    throw new Error("não usado neste teste");
  }
  async listByClient(): Promise<Asset[]> {
    return this.rows;
  }
  async markAnalyzed(): Promise<Asset | null> {
    throw new Error("não usado neste teste");
  }
  async markFailed(): Promise<Asset | null> {
    throw new Error("não usado neste teste");
  }
}

function makeAsset(overrides: Partial<Asset>): Asset {
  const now = "2026-01-01T00:00:00.000Z";
  return {
    id: "asset-1",
    orgId: ORG_ID,
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
    sourceUrl: null,
    importedBy: null,
    analyzedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const NO_BRAND_KIT: BrandKit | null = null;

describe("StyleCoverageService (ADENDO-01, cobertura de estilos)", () => {
  it("sem nenhum asset, só os estilos sem requisito ficam disponíveis", async () => {
    const service = new StyleCoverageService(new FakeAssetRepository([]));
    const result = await service.evaluate(ORG_ID, CLIENT_ID, NO_BRAND_KIT);

    expect(result.total).toBe(8);
    expect(result.available).toBe(5); // noite-futurista, fio-de-thread, nevoa-suave, grade-silenciosa, capa-de-campanha
    const blocked = result.styles.filter((s) => !s.available);
    expect(blocked.map((s) => s.id).sort()).toEqual(
      ["canto-escuro", "manchete-sangrada", "revista-autoral"].sort(),
    );
    for (const style of blocked) {
      expect(style.reason).toMatch(/foto/);
    }
  });

  it("uma foto vertical com faixa inferior escura libera manchete-sangrada, revista-autoral e canto-escuro", async () => {
    const verticalDarkPhoto = makeAsset({ id: "asset-vertical", width: 1080, height: 1350, luminanceBottom: 0.15 });
    const service = new StyleCoverageService(new FakeAssetRepository([verticalDarkPhoto]));
    const result = await service.evaluate(ORG_ID, CLIENT_ID, NO_BRAND_KIT);

    expect(result.available).toBe(8);
    const cantoEscuro = result.styles.find((s) => s.id === "canto-escuro");
    expect(cantoEscuro?.available).toBe(true);
  });

  it("foto clara (sem faixa escura) não libera manchete-sangrada nem canto-escuro, mas libera revista-autoral", async () => {
    const lightPhoto = makeAsset({ width: 1080, height: 1350, luminanceTop: 0.8, luminanceBottom: 0.8 });
    const service = new StyleCoverageService(new FakeAssetRepository([lightPhoto]));
    const result = await service.evaluate(ORG_ID, CLIENT_ID, NO_BRAND_KIT);

    expect(result.styles.find((s) => s.id === "revista-autoral")?.available).toBe(true);
    expect(result.styles.find((s) => s.id === "manchete-sangrada")?.available).toBe(false);
    expect(result.styles.find((s) => s.id === "canto-escuro")?.available).toBe(false);
  });

  it("foto quadrada (1:1) não conta para os estilos que pedem foto vertical", async () => {
    const squarePhoto = makeAsset({ width: 1080, height: 1080, luminanceBottom: 0.1 });
    const service = new StyleCoverageService(new FakeAssetRepository([squarePhoto]));
    const result = await service.evaluate(ORG_ID, CLIENT_ID, NO_BRAND_KIT);

    // manchete-sangrada só pede faixa escura (sem ratio) — essa passa
    expect(result.styles.find((s) => s.id === "manchete-sangrada")?.available).toBe(true);
    // revista-autoral e canto-escuro pedem vertical — essa não passa
    expect(result.styles.find((s) => s.id === "revista-autoral")?.available).toBe(false);
    expect(result.styles.find((s) => s.id === "canto-escuro")?.available).toBe(false);
  });

  it("asset pending (ainda não analisado) não conta pra cobertura", async () => {
    const pendingPhoto = makeAsset({ status: "pending", luminanceBottom: 0.1 });
    const service = new StyleCoverageService(new FakeAssetRepository([pendingPhoto]));
    const result = await service.evaluate(ORG_ID, CLIENT_ID, NO_BRAND_KIT);

    expect(result.styles.find((s) => s.id === "manchete-sangrada")?.available).toBe(false);
  });
});
