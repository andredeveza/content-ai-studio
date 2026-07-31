import { describe, expect, it } from "vitest";
import { IngestAssetUseCase, detectAssetKind } from "@/core/application/use-cases/ingest-asset";
import type { Asset, AssetAnalysisPatch, NewAsset } from "@/core/domain/asset/asset";
import type { AssetRepository } from "@/core/domain/ports/asset-repository";
import type { StoragePort, UploadInput } from "@/core/domain/ports/storage";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CLIENT_ID = "22222222-2222-4222-8222-222222222222";

class FakeAssetRepository implements AssetRepository {
  readonly created: NewAsset[] = [];
  async create(input: NewAsset): Promise<Asset> {
    this.created.push(input);
    const now = new Date(2026, 0, 1).toISOString();
    return {
      id: "asset-1",
      orgId: input.orgId,
      clientId: input.clientId,
      path: input.path,
      mime: input.mime,
      kind: input.kind,
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
      sourceUrl: input.sourceUrl ?? null,
      importedBy: input.importedBy ?? null,
      analyzedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }
  async findById(): Promise<Asset | null> {
    throw new Error("não usado neste teste");
  }
  async listByClient(): Promise<Asset[]> {
    throw new Error("não usado neste teste");
  }
  async listAnalyzedImagesByClient(): Promise<Asset[]> {
    throw new Error("não usado neste teste");
  }
  async markAnalyzed(_assetId: string, _patch: AssetAnalysisPatch): Promise<Asset | null> {
    throw new Error("não usado neste teste");
  }
  async markFailed(): Promise<Asset | null> {
    throw new Error("não usado neste teste");
  }
}

class FakeStorage implements StoragePort {
  readonly uploaded: UploadInput[] = [];
  async upload(input: UploadInput): Promise<{ path: string; publicUrl: string }> {
    this.uploaded.push(input);
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

describe("detectAssetKind (bloco 7)", () => {
  it("reconhece imagem pelo mime", () => {
    expect(detectAssetKind("image/png", "foto.png")).toBe("image");
  });
  it("reconhece pdf pelo mime ou extensão", () => {
    expect(detectAssetKind("application/pdf", "catalogo.pdf")).toBe("pdf");
    expect(detectAssetKind("application/octet-stream", "catalogo.PDF")).toBe("pdf");
  });
  it("reconhece fonte pela extensão", () => {
    expect(detectAssetKind("font/ttf", "Marca-Bold.ttf")).toBe("font");
    expect(detectAssetKind("application/octet-stream", "marca.woff2")).toBe("font");
  });
  it("retorna null para formato não suportado", () => {
    expect(detectAssetKind("application/zip", "arquivo.zip")).toBeNull();
  });
});

describe("IngestAssetUseCase (bloco 7)", () => {
  it("sobe o arquivo e grava o asset com status pending", async () => {
    const assets = new FakeAssetRepository();
    const storage = new FakeStorage();
    const useCase = new IngestAssetUseCase(assets, storage);

    const result = await useCase.execute({
      orgId: ORG_ID,
      clientId: CLIENT_ID,
      key: "upload-1",
      filename: "foto-grao.jpg",
      mime: "image/jpeg",
      file: Buffer.from("fake-jpeg-bytes"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.kind).toBe("image");
    expect(result.value.status).toBe("pending");
    expect(storage.uploaded[0]?.path).toBe(`${ORG_ID}/${CLIENT_ID}/upload-1/foto-grao.jpg`);
    expect(assets.created[0]?.kind).toBe("image");
  });

  it("rejeita formato não suportado sem subir nada", async () => {
    const assets = new FakeAssetRepository();
    const storage = new FakeStorage();
    const useCase = new IngestAssetUseCase(assets, storage);

    const result = await useCase.execute({
      orgId: ORG_ID,
      clientId: CLIENT_ID,
      key: "upload-2",
      filename: "planilha.xlsx",
      mime: "application/vnd.ms-excel",
      file: Buffer.from("bytes"),
    });

    expect(result.ok).toBe(false);
    expect(storage.uploaded).toHaveLength(0);
    expect(assets.created).toHaveLength(0);
  });
});
