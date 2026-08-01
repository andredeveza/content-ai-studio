import { describe, expect, it } from "vitest";
import { RegenerateSlideMediaUseCase } from "@/core/application/use-cases/regenerate-slide-media";
import { PromptService } from "@/core/application/services/prompt.service";
import type { AIContext, AIImageGenerator } from "@/core/domain/ports/ai-text-generator";
import type { ImageInput, ImageOutput } from "@/core/domain/ports/ai-provider";
import type { BrandKitRepository } from "@/core/domain/ports/brand-kit-repository";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";
import type { SlideRepository } from "@/core/domain/ports/slide-repository";
import type { BrandKit, NewBrandKit } from "@/core/domain/brandkit/brand-kit";
import type { NewProject, Project, ProjectPatch } from "@/core/domain/project/project";
import type { NewSlide, Slide, SlideOverrides } from "@/core/domain/project/slide";
import type { SlideContent } from "@/core/domain/template/slide-content";
import { ExternalServiceError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

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
  async update(_orgId: string, _projectId: string, _patch: ProjectPatch): Promise<Project | null> {
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
  async setMediaId(): Promise<Slide | null> {
    throw new Error("não usado");
  }
  async updateOverrides(slideId: string, overrides: SlideOverrides | null): Promise<Slide | null> {
    if (slideId !== this.slide.id) return null;
    this.slide = { ...this.slide, overrides };
    return this.slide;
  }
}

class FakeImageGenerator implements AIImageGenerator {
  calls: ImageInput[] = [];
  shouldFail = false;
  async generateImage(input: ImageInput, _ctx: AIContext): Promise<Result<ImageOutput, AppError>> {
    this.calls.push(input);
    if (this.shouldFail) return err(new ExternalServiceError("provedor fora do ar", "fake"));
    return ok({ imageUrl: `https://img.example.com/${this.calls.length}.png`, model: "fake-model" });
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
  imageStyle: "fotografia corporativa",
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
    theme: "Tema qualquer",
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
    archetypeId: "foto-total",
    role: null,
    variant: null,
    content: { texts: { heading: "Manchete" }, media: { media: "https://old.example.com/a.jpg" } },
    overrides: null,
    mediaId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("RegenerateSlideMediaUseCase (bloco 8)", () => {
  it("gera uma imagem nova por IA e grava como override de mídia", async () => {
    const slides = new FakeSlideRepository(makeSlide());
    const projects = new FakeProjectRepository(makeProject());
    const brandKits = new FakeBrandKitRepository(brandKit);
    const imageGenerator = new FakeImageGenerator();
    const useCase = new RegenerateSlideMediaUseCase(slides, projects, brandKits, imageGenerator, new PromptService());

    const result = await useCase.execute(ORG_ID, "slide-1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.overrides?.media?.media).toBe("https://img.example.com/1.png");
    expect(imageGenerator.calls).toHaveLength(1);
  });

  it("rejeita quando o arquétipo efetivo não tem slot de mídia", async () => {
    const slides = new FakeSlideRepository(makeSlide({ archetypeId: "dado" }));
    const projects = new FakeProjectRepository(makeProject());
    const brandKits = new FakeBrandKitRepository(brandKit);
    const imageGenerator = new FakeImageGenerator();
    const useCase = new RegenerateSlideMediaUseCase(slides, projects, brandKits, imageGenerator, new PromptService());

    const result = await useCase.execute(ORG_ID, "slide-1");

    expect(result.ok).toBe(false);
    expect(imageGenerator.calls).toHaveLength(0);
  });

  it("considera o override de variante ao decidir se há slot de mídia", async () => {
    // arquétipo base não tem mídia, mas o usuário trocou pra um que tem
    const slides = new FakeSlideRepository(
      makeSlide({ archetypeId: "dado", overrides: { archetypeId: "foto-total" } }),
    );
    const projects = new FakeProjectRepository(makeProject());
    const brandKits = new FakeBrandKitRepository(brandKit);
    const imageGenerator = new FakeImageGenerator();
    const useCase = new RegenerateSlideMediaUseCase(slides, projects, brandKits, imageGenerator, new PromptService());

    const result = await useCase.execute(ORG_ID, "slide-1");

    expect(result.ok).toBe(true);
    expect(imageGenerator.calls).toHaveLength(1);
  });

  it("propaga falha do gerador de imagem sem gravar override", async () => {
    const slides = new FakeSlideRepository(makeSlide());
    const projects = new FakeProjectRepository(makeProject());
    const brandKits = new FakeBrandKitRepository(brandKit);
    const imageGenerator = new FakeImageGenerator();
    imageGenerator.shouldFail = true;
    const useCase = new RegenerateSlideMediaUseCase(slides, projects, brandKits, imageGenerator, new PromptService());

    const result = await useCase.execute(ORG_ID, "slide-1");

    expect(result.ok).toBe(false);
  });
});
