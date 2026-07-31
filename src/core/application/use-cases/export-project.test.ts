import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { ExportProjectUseCase } from "@/core/application/use-cases/export-project";
import { RerenderSlideUseCase } from "@/core/application/use-cases/rerender-slide";
import type { RenderedSlide, RenderSlideInput, RenderSlidePort } from "@/core/application/use-cases/render-slide";
import type { BrandKit, NewBrandKit } from "@/core/domain/brandkit/brand-kit";
import type { BrandKitRepository } from "@/core/domain/ports/brand-kit-repository";
import type { Media, NewMedia } from "@/core/domain/media/media";
import type { MediaRepository } from "@/core/domain/ports/media-repository";
import type { NewProject, Project } from "@/core/domain/project/project";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";
import type { NewSlide, Slide, SlideOverrides } from "@/core/domain/project/slide";
import type { SlideRepository } from "@/core/domain/ports/slide-repository";
import type { SlideContent } from "@/core/domain/template/slide-content";
import type { StoragePort, UploadInput } from "@/core/domain/ports/storage";
import { ok, type Result } from "@/shared/result";
import type { AppError } from "@/shared/errors";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const now = "2026-01-01T00:00:00.000Z";

class FakeProjectRepository implements ProjectRepository {
  constructor(private readonly project: Project) {}
  async create(_input: NewProject): Promise<Project> {
    throw new Error("não usado");
  }
  async findById(orgId: string, projectId: string): Promise<Project | null> {
    return orgId === this.project.orgId && projectId === this.project.id ? this.project : null;
  }
  async update(): Promise<Project | null> {
    throw new Error("não usado");
  }
  async listByOrg(): Promise<Project[]> {
    throw new Error("não usado");
  }
}

class FakeSlideRepository implements SlideRepository {
  constructor(private rows: Slide[]) {}
  async upsertMany(_projectId: string, _slides: readonly NewSlide[]): Promise<Slide[]> {
    throw new Error("não usado");
  }
  async listByProject(projectId: string): Promise<Slide[]> {
    return this.rows.filter((s) => s.projectId === projectId);
  }
  async findById(slideId: string): Promise<Slide | null> {
    return this.rows.find((s) => s.id === slideId) ?? null;
  }
  async updateContent(_slideId: string, _content: SlideContent): Promise<Slide | null> {
    throw new Error("não usado");
  }
  async setMediaId(slideId: string, mediaId: string): Promise<Slide | null> {
    const i = this.rows.findIndex((s) => s.id === slideId);
    if (i === -1) return null;
    this.rows[i] = { ...this.rows[i]!, mediaId };
    return this.rows[i]!;
  }
  async updateOverrides(_slideId: string, _overrides: SlideOverrides | null): Promise<Slide | null> {
    throw new Error("não usado");
  }
}

class FakeMediaRepository implements MediaRepository {
  constructor(private rows: Media[]) {}
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
      createdAt: now,
    };
    this.rows.push(media);
    return media;
  }
  async findById(orgId: string, mediaId: string): Promise<Media | null> {
    return this.rows.find((m) => m.id === mediaId && m.orgId === orgId) ?? null;
  }
}

class FakeMediaStorage implements StoragePort {
  readonly downloaded: string[] = [];
  async upload(input: UploadInput): Promise<{ path: string; publicUrl: string }> {
    return { path: input.path, publicUrl: `https://storage.local/media/${input.path}` };
  }
  async remove(): Promise<void> {}
  getPublicUrl(path: string): string {
    return `https://storage.local/media/${path}`;
  }
  async download(path: string): Promise<Buffer> {
    this.downloaded.push(path);
    return Buffer.from(`conteudo-fake-de-${path}`);
  }
}

class FakeExportStorage implements StoragePort {
  uploaded: UploadInput[] = [];
  async upload(input: UploadInput): Promise<{ path: string; publicUrl: string }> {
    this.uploaded.push(input);
    return { path: input.path, publicUrl: `https://storage.local/exports/${input.path}` };
  }
  async remove(): Promise<void> {}
  getPublicUrl(path: string): string {
    return `https://storage.local/exports/${path}`;
  }
  async download(): Promise<Buffer> {
    throw new Error("não usado");
  }
}

class FakeBrandKitRepository implements BrandKitRepository {
  constructor(private readonly brandKit: BrandKit) {}
  async findByClientId(clientId: string): Promise<BrandKit | null> {
    return clientId === this.brandKit.clientId ? this.brandKit : null;
  }
  async upsert(_clientId: string, _input: NewBrandKit): Promise<BrandKit> {
    throw new Error("não usado");
  }
  async setLogoPath(): Promise<BrandKit | null> {
    throw new Error("não usado");
  }
}

class FakeRenderSlidePort implements RenderSlidePort {
  calls: RenderSlideInput[] = [];
  async execute(input: RenderSlideInput): Promise<Result<RenderedSlide, AppError>> {
    this.calls.push(input);
    return ok({ id: "media-rerendered", path: `${input.orgId}/${input.key}.png`, width: input.canvas.w, height: input.canvas.h });
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
  chrome: { top: ["@cliente"], footer: "arraste", footerLast: "salve" },
  rules: { neonMaxArea: "detail", alternateModes: true, blurTextForbidden: true },
  imageStyle: null,
  cta: "Fale com a gente",
  style: null,
  createdAt: now,
  updatedAt: now,
};

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    orgId: ORG_ID,
    clientId: "client-1",
    theme: "Tema",
    goal: "educar",
    status: "completed",
    progress: 100,
    slideCount: 2,
    ratio: "4:5",
    caption: "Legenda de teste",
    hashtags: ["um", "dois"],
    cta: "Fale com a gente",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeSlide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: "slide-1",
    projectId: "project-1",
    index: 0,
    archetypeId: "cover-centro",
    content: { texts: { kicker: "K", heading: "H", lead: "L" } },
    overrides: null,
    mediaId: "media-existing-1",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("ExportProjectUseCase (bloco 9)", () => {
  it("gera um zip com um PNG por slide (na ordem certa) e legenda.txt", async () => {
    const slides = [
      makeSlide({ id: "slide-1", index: 0, mediaId: "media-1" }),
      makeSlide({ id: "slide-2", index: 1, archetypeId: "fecho", mediaId: "media-2" }),
    ];
    const media = [
      { id: "media-1", orgId: ORG_ID, path: "org/p/0.png", kind: "slide-render", width: 1080, height: 1350, provider: "puppeteer", promptId: null, createdAt: now },
      { id: "media-2", orgId: ORG_ID, path: "org/p/1.png", kind: "slide-render", width: 1080, height: 1350, provider: "puppeteer", promptId: null, createdAt: now },
    ];

    const projectRepo = new FakeProjectRepository(makeProject());
    const slideRepo = new FakeSlideRepository(slides);
    const mediaRepo = new FakeMediaRepository(media);
    const mediaStorage = new FakeMediaStorage();
    const exportStorage = new FakeExportStorage();
    const renderer = new FakeRenderSlidePort();
    const rerender = new RerenderSlideUseCase(slideRepo, projectRepo, new FakeBrandKitRepository(brandKit), renderer);

    const useCase = new ExportProjectUseCase(projectRepo, slideRepo, mediaRepo, mediaStorage, exportStorage, rerender);
    const result = await useCase.execute(ORG_ID, "project-1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.publicUrl).toContain("carrossel.zip");
    expect(exportStorage.uploaded[0]?.path).toBe(`${ORG_ID}/project-1/carrossel.zip`);

    // nenhum slide tinha override, então nenhum rerender aconteceu
    expect(renderer.calls).toHaveLength(0);
    expect(mediaStorage.downloaded).toEqual(["org/p/0.png", "org/p/1.png"]);

    const zip = await JSZip.loadAsync(exportStorage.uploaded[0]!.file);
    const filenames = Object.keys(zip.files).sort();
    expect(filenames).toEqual(["legenda.txt", "slide-1.png", "slide-2.png"]);

    const legenda = await zip.file("legenda.txt")!.async("string");
    expect(legenda).toBe("Legenda de teste\n\n#um #dois\n\nFale com a gente");
  });

  it("re-renderiza antes de zipar só os slides com override pendente", async () => {
    const slides = [
      makeSlide({ id: "slide-1", index: 0, mediaId: "media-1", overrides: { texts: { heading: "Editado" } } }),
      makeSlide({ id: "slide-2", index: 1, archetypeId: "fecho", mediaId: "media-2" }),
    ];
    const media = [
      { id: "media-1", orgId: ORG_ID, path: "org/p/0.png", kind: "slide-render", width: 1080, height: 1350, provider: "puppeteer", promptId: null, createdAt: now },
      { id: "media-2", orgId: ORG_ID, path: "org/p/1.png", kind: "slide-render", width: 1080, height: 1350, provider: "puppeteer", promptId: null, createdAt: now },
      { id: "media-rerendered", orgId: ORG_ID, path: "org/p/0-fresh.png", kind: "slide-render", width: 1080, height: 1350, provider: "puppeteer", promptId: null, createdAt: now },
    ];

    const projectRepo = new FakeProjectRepository(makeProject());
    const slideRepo = new FakeSlideRepository(slides);
    const mediaRepo = new FakeMediaRepository(media);
    const mediaStorage = new FakeMediaStorage();
    const exportStorage = new FakeExportStorage();
    const renderer = new FakeRenderSlidePort();
    const rerender = new RerenderSlideUseCase(slideRepo, projectRepo, new FakeBrandKitRepository(brandKit), renderer);

    const useCase = new ExportProjectUseCase(projectRepo, slideRepo, mediaRepo, mediaStorage, exportStorage, rerender);
    const result = await useCase.execute(ORG_ID, "project-1");

    expect(result.ok).toBe(true);
    expect(renderer.calls).toHaveLength(1);
    expect(renderer.calls[0]?.content.texts.heading).toBe("Editado");
    // baixou o PNG recém-renderizado do slide 1 (não o antigo media-1)
    expect(mediaStorage.downloaded).toEqual(["org/p/0-fresh.png", "org/p/1.png"]);
  });

  it("propaga erro quando o projeto não existe", async () => {
    const projectRepo = new FakeProjectRepository(makeProject());
    const slideRepo = new FakeSlideRepository([]);
    const mediaRepo = new FakeMediaRepository([]);
    const mediaStorage = new FakeMediaStorage();
    const exportStorage = new FakeExportStorage();
    const renderer = new FakeRenderSlidePort();
    const rerender = new RerenderSlideUseCase(slideRepo, projectRepo, new FakeBrandKitRepository(brandKit), renderer);
    const useCase = new ExportProjectUseCase(projectRepo, slideRepo, mediaRepo, mediaStorage, exportStorage, rerender);

    const result = await useCase.execute(ORG_ID, "projeto-inexistente");
    expect(result.ok).toBe(false);
  });

  it("propaga erro quando um slide ainda não foi renderizado (sem mediaId)", async () => {
    const slides = [makeSlide({ mediaId: null })];
    const projectRepo = new FakeProjectRepository(makeProject({ slideCount: 1 }));
    const slideRepo = new FakeSlideRepository(slides);
    const mediaRepo = new FakeMediaRepository([]);
    const mediaStorage = new FakeMediaStorage();
    const exportStorage = new FakeExportStorage();
    const renderer = new FakeRenderSlidePort();
    const rerender = new RerenderSlideUseCase(slideRepo, projectRepo, new FakeBrandKitRepository(brandKit), renderer);
    const useCase = new ExportProjectUseCase(projectRepo, slideRepo, mediaRepo, mediaStorage, exportStorage, rerender);

    const result = await useCase.execute(ORG_ID, "project-1");
    expect(result.ok).toBe(false);
  });
});
