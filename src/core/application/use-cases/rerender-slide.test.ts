import { describe, expect, it } from "vitest";
import { RerenderSlideUseCase } from "@/core/application/use-cases/rerender-slide";
import type { RenderedSlide, RenderSlideInput, RenderSlidePort } from "@/core/application/use-cases/render-slide";
import type { BrandKitRepository } from "@/core/domain/ports/brand-kit-repository";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";
import type { SlideRepository } from "@/core/domain/ports/slide-repository";
import type { BrandKit, NewBrandKit } from "@/core/domain/brandkit/brand-kit";
import type { NewProject, Project } from "@/core/domain/project/project";
import type { NewSlide, Slide, SlideOverrides } from "@/core/domain/project/slide";
import type { SlideContent } from "@/core/domain/template/slide-content";
import { err, ok, type Result } from "@/shared/result";
import { ExternalServiceError, type AppError } from "@/shared/errors";

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

class FakeSlideRepository implements SlideRepository {
  constructor(private slide: Slide) {}
  async upsertMany(_projectId: string, _slides: readonly NewSlide[]): Promise<Slide[]> {
    throw new Error("não usado");
  }
  async listByProject(): Promise<Slide[]> {
    throw new Error("não usado");
  }
  async findById(slideId: string): Promise<Slide | null> {
    return slideId === this.slide.id ? this.slide : null;
  }
  async updateContent(_slideId: string, _content: SlideContent): Promise<Slide | null> {
    throw new Error("não usado");
  }
  async setMediaId(slideId: string, mediaId: string): Promise<Slide | null> {
    if (slideId !== this.slide.id) return null;
    this.slide = { ...this.slide, mediaId };
    return this.slide;
  }
  async updateOverrides(_slideId: string, _overrides: SlideOverrides | null): Promise<Slide | null> {
    throw new Error("não usado");
  }
}

class FakeRenderSlidePort implements RenderSlidePort {
  calls: RenderSlideInput[] = [];
  shouldFail = false;
  async execute(input: RenderSlideInput): Promise<Result<RenderedSlide, AppError>> {
    this.calls.push(input);
    if (this.shouldFail) return err(new ExternalServiceError("render falhou", "render-service"));
    return ok({ id: "media-1", path: `${input.orgId}/${input.key}.png`, width: input.canvas.w, height: input.canvas.h });
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
    slideCount: 6,
    ratio: "4:5",
    styleId: "nevoa-suave",
    format: "carousel" as const,
    mediaSource: null,
    caption: null,
    hashtags: [],
    cta: null,
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
    role: null,
    variant: null,
    content: { texts: { kicker: "DICA", heading: "Título", lead: "Apoio" } },
    overrides: null,
    mediaId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("RerenderSlideUseCase (bloco 8)", () => {
  it("renderiza o conteúdo efetivo (com overrides já mesclados) e atualiza o mediaId", async () => {
    const slides = new FakeSlideRepository(
      makeSlide({ overrides: { texts: { heading: "Título editado" } } }),
    );
    const projects = new FakeProjectRepository(makeProject());
    const brandKits = new FakeBrandKitRepository(brandKit);
    const renderer = new FakeRenderSlidePort();
    const useCase = new RerenderSlideUseCase(slides, projects, brandKits, renderer);

    const result = await useCase.execute(ORG_ID, "slide-1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.mediaId).toBe("media-1");
    expect(renderer.calls[0]?.content.texts.heading).toBe("Título editado");
    expect(renderer.calls[0]?.isLastSlide).toBe(false);
  });

  it("marca isLastSlide=true quando o índice do slide é o último do projeto", async () => {
    const slides = new FakeSlideRepository(makeSlide({ index: 5, archetypeId: "fecho" }));
    const projects = new FakeProjectRepository(makeProject({ slideCount: 6 }));
    const brandKits = new FakeBrandKitRepository(brandKit);
    const renderer = new FakeRenderSlidePort();
    const useCase = new RerenderSlideUseCase(slides, projects, brandKits, renderer);

    await useCase.execute(ORG_ID, "slide-1");

    expect(renderer.calls[0]?.isLastSlide).toBe(true);
  });

  it("propaga falha do render sem atualizar o slide", async () => {
    const slides = new FakeSlideRepository(makeSlide());
    const projects = new FakeProjectRepository(makeProject());
    const brandKits = new FakeBrandKitRepository(brandKit);
    const renderer = new FakeRenderSlidePort();
    renderer.shouldFail = true;
    const useCase = new RerenderSlideUseCase(slides, projects, brandKits, renderer);

    const result = await useCase.execute(ORG_ID, "slide-1");

    expect(result.ok).toBe(false);
  });
});
