import { describe, expect, it } from "vitest";
import { UpdateSlideOverridesUseCase } from "@/core/application/use-cases/update-slide-overrides";
import type { NewProject, Project, ProjectPatch } from "@/core/domain/project/project";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";
import type { NewSlide, Slide, SlideOverrides } from "@/core/domain/project/slide";
import type { SlideRepository } from "@/core/domain/ports/slide-repository";
import type { SlideContent } from "@/core/domain/template/slide-content";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG_ID = "99999999-9999-4999-8999-999999999999";
const PROJECT_ID = "project-1";
const now = "2026-01-01T00:00:00.000Z";

class FakeProjectRepository implements ProjectRepository {
  constructor(private readonly project: Project) {}
  async create(_input: NewProject): Promise<Project> {
    throw new Error("não usado neste teste");
  }
  async findById(orgId: string, projectId: string): Promise<Project | null> {
    return orgId === this.project.orgId && projectId === this.project.id ? this.project : null;
  }
  async update(_orgId: string, _projectId: string, _patch: ProjectPatch): Promise<Project | null> {
    throw new Error("não usado neste teste");
  }
  async listByOrg(): Promise<Project[]> {
    throw new Error("não usado neste teste");
  }
}

class FakeSlideRepository implements SlideRepository {
  constructor(private slide: Slide) {}
  async upsertMany(_projectId: string, _slides: readonly NewSlide[]): Promise<Slide[]> {
    throw new Error("não usado neste teste");
  }
  async listByProject(): Promise<Slide[]> {
    throw new Error("não usado neste teste");
  }
  async findById(slideId: string): Promise<Slide | null> {
    return slideId === this.slide.id ? this.slide : null;
  }
  async updateContent(_slideId: string, _content: SlideContent): Promise<Slide | null> {
    throw new Error("não usado neste teste");
  }
  async setMediaId(): Promise<Slide | null> {
    throw new Error("não usado neste teste");
  }
  async updateOverrides(slideId: string, overrides: SlideOverrides | null): Promise<Slide | null> {
    if (slideId !== this.slide.id) return null;
    this.slide = { ...this.slide, overrides };
    return this.slide;
  }
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: PROJECT_ID,
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
    projectId: PROJECT_ID,
    index: 0,
    archetypeId: "cover-centro",
    role: null,
    variant: null,
    content: { texts: { kicker: "DICA", heading: "Original", lead: "Apoio" } },
    overrides: null,
    mediaId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("UpdateSlideOverridesUseCase (bloco 8)", () => {
  it("cria overrides novos quando o slide ainda não tinha nenhum", async () => {
    const slides = new FakeSlideRepository(makeSlide());
    const projects = new FakeProjectRepository(makeProject());
    const useCase = new UpdateSlideOverridesUseCase(slides, projects);

    const result = await useCase.execute(ORG_ID, "slide-1", { texts: { heading: "Editado" } });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.overrides?.texts?.heading).toBe("Editado");
  });

  it("mescla com overrides já existentes sem apagar o que não veio no patch", async () => {
    const slides = new FakeSlideRepository(
      makeSlide({ overrides: { texts: { heading: "Primeira edição" }, archetypeId: "fecho" } }),
    );
    const projects = new FakeProjectRepository(makeProject());
    const useCase = new UpdateSlideOverridesUseCase(slides, projects);

    const result = await useCase.execute(ORG_ID, "slide-1", { texts: { lead: "Novo apoio" } });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.overrides?.texts?.heading).toBe("Primeira edição");
    expect(result.value.overrides?.texts?.lead).toBe("Novo apoio");
    expect(result.value.overrides?.archetypeId).toBe("fecho");
  });

  it("troca a variante (archetypeId) quando enviado no patch", async () => {
    const slides = new FakeSlideRepository(makeSlide());
    const projects = new FakeProjectRepository(makeProject());
    const useCase = new UpdateSlideOverridesUseCase(slides, projects);

    const result = await useCase.execute(ORG_ID, "slide-1", { archetypeId: "numerada" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.overrides?.archetypeId).toBe("numerada");
  });

  it("rejeita quando o slide pertence a um projeto de outra org", async () => {
    const slides = new FakeSlideRepository(makeSlide());
    const projects = new FakeProjectRepository(makeProject());
    const useCase = new UpdateSlideOverridesUseCase(slides, projects);

    const result = await useCase.execute(OTHER_ORG_ID, "slide-1", { texts: { heading: "Hackeado" } });

    expect(result.ok).toBe(false);
  });

  it("rejeita patch com archetypeId inválido", async () => {
    const slides = new FakeSlideRepository(makeSlide());
    const projects = new FakeProjectRepository(makeProject());
    const useCase = new UpdateSlideOverridesUseCase(slides, projects);

    // @ts-expect-error arquétipo inválido de propósito
    const result = await useCase.execute(ORG_ID, "slide-1", { archetypeId: "inexistente" });

    expect(result.ok).toBe(false);
  });
});
