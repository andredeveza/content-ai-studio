import { describe, expect, it } from "vitest";
import { RenderSlideUseCase } from "@/core/application/use-cases/render-slide";
import { TemplateEngineService } from "@/core/application/services/template-engine.service";
import { getBlueprint } from "@/templates/blueprints";
import type { RenderInput, RenderOutput, RenderPort } from "@/core/domain/ports/render";
import type { StoragePort, UploadInput } from "@/core/domain/ports/storage";
import type { Media, NewMedia } from "@/core/domain/media/media";
import type { MediaRepository } from "@/core/domain/ports/media-repository";
import type { BrandKit } from "@/core/domain/brandkit/brand-kit";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

class FakeRenderer implements RenderPort {
  readonly calls: RenderInput[] = [];
  shouldFail = false;

  async screenshot(input: RenderInput): Promise<RenderOutput> {
    this.calls.push(input);
    if (this.shouldFail) throw new Error("chromium caiu");
    return { png: Buffer.concat([PNG_MAGIC, Buffer.from("fake-png-body")]) };
  }
}

class FakeStorage implements StoragePort {
  readonly uploaded: UploadInput[] = [];
  shouldFail = false;

  async upload(input: UploadInput): Promise<{ path: string; publicUrl: string }> {
    this.uploaded.push(input);
    if (this.shouldFail) throw new Error("bucket indisponível");
    return { path: input.path, publicUrl: `https://storage.local/media/${input.path}` };
  }

  async remove(): Promise<void> {}

  getPublicUrl(path: string): string {
    return `https://storage.local/media/${path}`;
  }

  async download(): Promise<Buffer> {
    return Buffer.from("");
  }
}

class FakeMediaRepository implements MediaRepository {
  readonly rows: Media[] = [];

  async create(input: NewMedia): Promise<Media> {
    const media: Media = {
      id: `media-${this.rows.length + 1}`,
      orgId: input.orgId,
      path: input.path,
      kind: input.kind,
      width: input.width,
      height: input.height,
      provider: input.provider ?? null,
      promptId: input.promptId ?? null,
      createdAt: new Date(2026, 0, 1).toISOString(),
    };
    this.rows.push(media);
    return media;
  }

  async findById(orgId: string, mediaId: string): Promise<Media | null> {
    return this.rows.find((row) => row.id === mediaId && row.orgId === orgId) ?? null;
  }
}

const brandKit: BrandKit = {
  id: "brandkit-1",
  clientId: "client-1",
  palette: {
    ink: "#06070A",
    graphite: "#101319",
    slate: "#1B212B",
    gray: "#8B94A3",
    title: "#EEF1F6",
    brand: "#0A47A8",
    primary: "#1C7ED6",
    accent: "#57A8FF",
    loud: "#1C4FE0",
    bgLight: "#FFFFFF",
    panelLight: "#F4F6FA",
    titleLight: "#0A0C10",
    textLight: "#5A6474",
  },
  gradient: "linear-gradient(135deg, #0A47A8, #1C7ED6 55%, #57A8FF)",
  fonts: {
    display: { family: "Satoshi", weights: [700, 900] },
    body: { family: "General Sans", weights: [400, 500] },
    mono: { family: "JetBrains Mono", weights: [400, 500] },
  },
  logo: { path: null, radius: 0 },
  chrome: { top: ["@trafegodigitalad"], footer: "arraste", footerLast: "salve" },
  rules: { neonMaxArea: "detail", alternateModes: true, blurTextForbidden: true },
  imageStyle: null,
  cta: "Fale com a gente",
  style: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CANVAS = { w: 1080, h: 1350 };

function buildUseCase() {
  const renderer = new FakeRenderer();
  const storage = new FakeStorage();
  const mediaRepository = new FakeMediaRepository();
  const useCase = new RenderSlideUseCase(new TemplateEngineService(), renderer, storage, mediaRepository);
  return { useCase, renderer, storage, mediaRepository };
}

describe("RenderSlideUseCase (bloco 5)", () => {
  it("monta o HTML, tira o screenshot, sobe pro storage e grava o registro de media", async () => {
    const { useCase, renderer, storage, mediaRepository } = buildUseCase();

    const result = await useCase.execute({
      orgId: ORG_ID,
      key: "proj-1/0",
      blueprint: getBlueprint("cover-centro"),
      canvas: CANVAS,
      content: { texts: { kicker: "TEMA", heading: "Título forte", lead: "Apoio" } },
      brandKit,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(renderer.calls).toHaveLength(1);
    expect(renderer.calls[0]?.width).toBe(1080);
    expect(renderer.calls[0]?.height).toBe(1350);
    expect(renderer.calls[0]?.html).toContain("Título forte");

    expect(storage.uploaded).toHaveLength(1);
    expect(storage.uploaded[0]?.path).toBe(`${ORG_ID}/proj-1/0.png`);
    expect(storage.uploaded[0]?.contentType).toBe("image/png");

    expect(mediaRepository.rows).toHaveLength(1);
    expect(result.value.path).toBe(`${ORG_ID}/proj-1/0.png`);
    expect(result.value.width).toBe(1080);
    expect(result.value.height).toBe(1350);
    expect(result.value.provider).toBe("puppeteer");
  });

  it("propaga falha do Puppeteer sem gravar media nem subir arquivo", async () => {
    const { useCase, renderer, storage, mediaRepository } = buildUseCase();
    renderer.shouldFail = true;

    const result = await useCase.execute({
      orgId: ORG_ID,
      key: "proj-1/0",
      blueprint: getBlueprint("cover-centro"),
      canvas: CANVAS,
      content: { texts: { kicker: "TEMA", heading: "Título", lead: "Apoio" } },
      brandKit,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("EXTERNAL_SERVICE_ERROR");
    expect(storage.uploaded).toHaveLength(0);
    expect(mediaRepository.rows).toHaveLength(0);
  });

  it("propaga falha do Storage sem gravar media", async () => {
    const { useCase, storage, mediaRepository } = buildUseCase();
    storage.shouldFail = true;

    const result = await useCase.execute({
      orgId: ORG_ID,
      key: "proj-1/0",
      blueprint: getBlueprint("cover-centro"),
      canvas: CANVAS,
      content: { texts: { kicker: "TEMA", heading: "Título", lead: "Apoio" } },
      brandKit,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("EXTERNAL_SERVICE_ERROR");
    expect(mediaRepository.rows).toHaveLength(0);
  });

  it("troca o rodapé quando isLastSlide=true", async () => {
    const { useCase, renderer } = buildUseCase();

    await useCase.execute({
      orgId: ORG_ID,
      key: "proj-1/7",
      blueprint: getBlueprint("fecho"),
      canvas: CANVAS,
      content: { texts: { heading: "Fim", lead: "Apoio", cta: "Fale com a gente" } },
      brandKit,
      isLastSlide: true,
    });

    expect(renderer.calls[0]?.html).toContain("salve");
  });
});
