import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { PipelineWorker, type PipelineWorkerDeps } from "@/core/application/services/pipeline-worker.service";
import { ResearchService } from "@/core/application/services/research.service";
import { CopyService } from "@/core/application/services/copy.service";
import { PromptService } from "@/core/application/services/prompt.service";
import { ImageService } from "@/core/application/services/image.service";
import { NoopRetrievalService } from "@/core/application/services/retrieval.service";
import { NoopPublisher } from "@/core/application/services/publisher.service";
import { TemplateEngineService } from "@/core/application/services/template-engine.service";
import { RenderSlideUseCase } from "@/core/application/use-cases/render-slide";
import type { AIContext, AIImageGenerator, AITextGenerator } from "@/core/domain/ports/ai-text-generator";
import type { ImageInput, ImageOutput, TextInput } from "@/core/domain/ports/ai-provider";
import type { ClientRepository } from "@/core/domain/ports/client-repository";
import type { BrandKitRepository } from "@/core/domain/ports/brand-kit-repository";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";
import type { SlideRepository } from "@/core/domain/ports/slide-repository";
import type { JobRepository } from "@/core/domain/ports/job-repository";
import type { RenderInput, RenderOutput, RenderPort } from "@/core/domain/ports/render";
import type { StoragePort, UploadInput } from "@/core/domain/ports/storage";
import type { MediaRepository } from "@/core/domain/ports/media-repository";
import type { Client, NewClient } from "@/core/domain/client/client";
import type { BrandKit, NewBrandKit } from "@/core/domain/brandkit/brand-kit";
import type { Job, JobPatch, NewJob } from "@/core/domain/pipeline/job";
import type { Media, NewMedia } from "@/core/domain/media/media";
import type { NewProject, Project, ProjectPatch } from "@/core/domain/project/project";
import type { NewSlide, Slide } from "@/core/domain/project/slide";
import { ValidationError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CLIENT_ID = "22222222-2222-4222-8222-222222222222";

// ---------- fakes de domínio (mesmo padrão dos blocos 3/4/5) ----------

class FakeClientRepository implements ClientRepository {
  constructor(private readonly client: Client) {}
  async findById(orgId: string, clientId: string): Promise<Client | null> {
    return orgId === this.client.orgId && clientId === this.client.id ? this.client : null;
  }
  async listByOrg(): Promise<Client[]> {
    return [this.client];
  }
  async create(_input: NewClient): Promise<Client> {
    throw new Error("não usado neste teste");
  }
  async update(): Promise<Client | null> {
    throw new Error("não usado neste teste");
  }
  async delete(): Promise<boolean> {
    throw new Error("não usado neste teste");
  }
}

class FakeBrandKitRepository implements BrandKitRepository {
  constructor(private readonly brandKit: BrandKit) {}
  async findByClientId(clientId: string): Promise<BrandKit | null> {
    return clientId === this.brandKit.clientId ? this.brandKit : null;
  }
  async upsert(_clientId: string, _input: NewBrandKit): Promise<BrandKit> {
    throw new Error("não usado neste teste");
  }
  async setLogoPath(): Promise<BrandKit | null> {
    throw new Error("não usado neste teste");
  }
}

class FakeProjectRepository implements ProjectRepository {
  readonly rows = new Map<string, Project>();
  private seq = 0;

  async create(input: NewProject): Promise<Project> {
    this.seq += 1;
    const now = new Date(2026, 0, 1).toISOString();
    const project: Project = {
      id: `project-${this.seq}`,
      orgId: input.orgId,
      clientId: input.clientId,
      theme: input.theme,
      goal: input.goal,
      status: "draft",
      progress: 0,
      slideCount: input.slideCount,
      ratio: input.ratio ?? "4:5",
      caption: null,
      hashtags: [],
      cta: null,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(project.id, project);
    return project;
  }

  async findById(orgId: string, projectId: string): Promise<Project | null> {
    const project = this.rows.get(projectId);
    return project && project.orgId === orgId ? project : null;
  }

  async update(orgId: string, projectId: string, patch: ProjectPatch): Promise<Project | null> {
    const existing = await this.findById(orgId, projectId);
    if (!existing) return null;
    const updated: Project = { ...existing, ...patch };
    this.rows.set(projectId, updated);
    return updated;
  }
}

class FakeSlideRepository implements SlideRepository {
  readonly rows = new Map<string, Slide>();
  private seq = 0;

  async upsertMany(projectId: string, slides: readonly NewSlide[]): Promise<Slide[]> {
    const now = new Date(2026, 0, 1).toISOString();
    const created: Slide[] = [];
    for (const input of slides) {
      this.seq += 1;
      const slide: Slide = {
        id: `slide-${this.seq}`,
        projectId,
        index: input.index,
        archetypeId: input.archetypeId,
        content: input.content,
        mediaId: null,
        createdAt: now,
        updatedAt: now,
      };
      this.rows.set(slide.id, slide);
      created.push(slide);
    }
    return created;
  }

  async listByProject(projectId: string): Promise<Slide[]> {
    return [...this.rows.values()].filter((slide) => slide.projectId === projectId).sort((a, b) => a.index - b.index);
  }

  async updateContent(slideId: string, content: Slide["content"]): Promise<Slide | null> {
    const existing = this.rows.get(slideId);
    if (!existing) return null;
    const updated: Slide = { ...existing, content };
    this.rows.set(slideId, updated);
    return updated;
  }

  async setMediaId(slideId: string, mediaId: string): Promise<Slide | null> {
    const existing = this.rows.get(slideId);
    if (!existing) return null;
    const updated: Slide = { ...existing, mediaId };
    this.rows.set(slideId, updated);
    return updated;
  }
}

class FakeJobRepository implements JobRepository {
  readonly rows = new Map<string, Job>();
  private seq = 0;

  async create(input: NewJob): Promise<Job> {
    this.seq += 1;
    const now = new Date(2026, 0, 1).toISOString();
    const job: Job = {
      id: `job-${this.seq}`,
      orgId: input.orgId,
      projectId: input.projectId,
      step: "research",
      progress: 0,
      attempts: 0,
      payload: {},
      state: "pending",
      error: null,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(job.id, job);
    return job;
  }

  async findById(jobId: string): Promise<Job | null> {
    return this.rows.get(jobId) ?? null;
  }

  async update(jobId: string, patch: JobPatch): Promise<Job | null> {
    const existing = this.rows.get(jobId);
    if (!existing) return null;
    const updated: Job = { ...existing, ...patch };
    this.rows.set(jobId, updated);
    return updated;
  }
}

class FakeRenderer implements RenderPort {
  calls = 0;
  async screenshot(_input: RenderInput): Promise<RenderOutput> {
    this.calls += 1;
    return { png: Buffer.from("fake-png") };
  }
}

class FakeStorage implements StoragePort {
  readonly uploaded: UploadInput[] = [];
  async upload(input: UploadInput): Promise<{ path: string; publicUrl: string }> {
    this.uploaded.push(input);
    return { path: input.path, publicUrl: `https://storage.local/media/${input.path}` };
  }
  async remove(): Promise<void> {}
  getPublicUrl(path: string): string {
    return `https://storage.local/media/${path}`;
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

// Fila de respostas: cada chamada a generateStructured consome a próxima
// e valida contra o schema pedido, igual o AIGateway faria de verdade.
class FakeTextGenerator implements AITextGenerator {
  private queue: unknown[];
  failNextWith: Error | null = null;

  constructor(responses: unknown[]) {
    this.queue = [...responses];
  }

  async generateStructured<T>(_input: TextInput, schema: z.ZodType<T>, _ctx: AIContext): Promise<Result<T, AppError>> {
    if (this.failNextWith) {
      const failure = this.failNextWith;
      this.failNextWith = null;
      throw failure;
    }
    const next = this.queue.shift();
    if (next === undefined) throw new Error("FakeTextGenerator sem mais respostas na fila");
    const parsed = schema.safeParse(next);
    if (!parsed.success) return err(new ValidationError(parsed.error.message));
    return ok(parsed.data);
  }
}

class FakeImageGenerator implements AIImageGenerator {
  calls = 0;
  failNextWith: Error | null = null;

  async generateImage(_input: ImageInput, _ctx: AIContext): Promise<Result<ImageOutput, AppError>> {
    if (this.failNextWith) {
      const failure = this.failNextWith;
      this.failNextWith = null;
      throw failure;
    }
    this.calls += 1;
    return ok({ imageUrl: `https://img.example.com/${this.calls}.png`, model: "fake-image-model" });
  }
}

// ---------- dados de teste ----------

const client: Client = {
  id: CLIENT_ID,
  orgId: ORG_ID,
  name: "AD Tráfego Digital",
  handles: ["@trafegodigitalad"],
  persona: "Agência de tráfego pago direta e confiante",
  tone: ["direto", "confiante"],
  goals: [],
  specialties: [],
  site: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const brandKit: BrandKit = {
  id: "brandkit-1",
  clientId: CLIENT_ID,
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
  imageStyle: "fotografia corporativa, tons de azul",
  cta: "Fale com a gente",
  style: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const SLIDE_COUNT = 6;

const structureResponse = {
  slides: Array.from({ length: SLIDE_COUNT }, (_, i) => ({ brief: `Brief do slide ${i}` })),
};

// index 0 e 5 (último) são forçados para cover-centro/fecho pelo
// selectLayout independente do corpo — os demais têm sinais deliberados
// para exercitar citacao (com mídia), dado, lista-icone e evento.
const copyResponse = {
  slides: [
    { index: 0, heading: "Como vender mais no Instagram", kicker: "DICA", lead: "Aprenda o método" },
    {
      index: 1,
      heading: "O produto certo",
      body: '"o produto certo encontra o cliente certo" — Fundador',
      quote: "o produto certo encontra o cliente certo",
      author: "Fundador",
    },
    { index: 2, heading: "Cresceu 42%", body: "Aumentamos as vendas em 42% no trimestre" },
    {
      index: 3,
      heading: "Três passos",
      body: "siga o passo a passo",
      items: ["Planeje a campanha", "Defina o público", "Publique o anúncio"],
    },
    { index: 4, heading: "Live de lançamento", body: "Live no dia 12 de agosto às 19h", day: "12", month: "AGOSTO", detail: "19h, online" },
    { index: 5, heading: "Fale com a gente", lead: "Vamos conversar", ctaLabel: "Fale com a gente" },
  ],
  caption: "Como vender mais usando o Instagram na prática.",
  hashtags: ["marketingdigital", "instagram", "vendas"],
  cta: "Fale com a gente",
};

function buildDeps(textGenerator: FakeTextGenerator, imageGenerator: FakeImageGenerator) {
  const projects = new FakeProjectRepository();
  const slides = new FakeSlideRepository();
  const jobs = new FakeJobRepository();
  const renderer = new FakeRenderer();
  const storage = new FakeStorage();
  const mediaRepository = new FakeMediaRepository();

  const deps: PipelineWorkerDeps = {
    jobs,
    projects,
    slides,
    clients: new FakeClientRepository(client),
    brandKits: new FakeBrandKitRepository(brandKit),
    research: new ResearchService(textGenerator),
    copy: new CopyService(textGenerator),
    prompt: new PromptService(),
    image: new ImageService(imageGenerator, new NoopRetrievalService()),
    renderSlide: new RenderSlideUseCase(new TemplateEngineService(), renderer, storage, mediaRepository),
    publisher: new NoopPublisher(),
  };

  return { deps, projects, slides, jobs, renderer, storage, mediaRepository };
}

describe("PipelineWorker (bloco 6) — 7 steps, checkpoint e retomada", () => {
  it("roda os 7 steps do início ao fim e produz slides renderizados", async () => {
    const textGenerator = new FakeTextGenerator([structureResponse, copyResponse]);
    const imageGenerator = new FakeImageGenerator();
    const { deps, projects, slides, jobs, renderer } = buildDeps(textGenerator, imageGenerator);

    const project = await projects.create({
      orgId: ORG_ID,
      clientId: CLIENT_ID,
      theme: "Como vender mais no Instagram",
      goal: "converter",
      slideCount: SLIDE_COUNT,
    });
    const job = await jobs.create({ orgId: ORG_ID, projectId: project.id });

    const worker = new PipelineWorker(deps);
    const result = await worker.run(job.id);

    expect(result.ok).toBe(true);

    const finishedJob = await jobs.findById(job.id);
    expect(finishedJob?.state).toBe("completed");
    expect(finishedJob?.step).toBe("completed");
    expect(finishedJob?.progress).toBe(100);

    const finishedProject = await projects.findById(ORG_ID, project.id);
    expect(finishedProject?.status).toBe("completed");
    expect(finishedProject?.progress).toBe(100);
    expect(finishedProject?.caption).toBe(copyResponse.caption);
    expect(finishedProject?.hashtags).toEqual(copyResponse.hashtags);
    expect(finishedProject?.cta).toBe(copyResponse.cta);

    const finalSlides = await slides.listByProject(project.id);
    expect(finalSlides).toHaveLength(SLIDE_COUNT);
    expect(finalSlides[0]?.archetypeId).toBe("cover-centro");
    expect(finalSlides[5]?.archetypeId).toBe("fecho");
    expect(finalSlides.every((slide) => slide.mediaId !== null)).toBe(true);

    // "citacao" (índice 1) tem slot de mídia — só ele deve ter disparado
    // o ImageService (dado/lista-icone/evento/cover/fecho não têm media).
    const citacaoSlide = finalSlides.find((slide) => slide.archetypeId === "citacao");
    expect(citacaoSlide).toBeTruthy();
    expect(citacaoSlide?.content.media?.media).toMatch(/^https:\/\/img\.example\.com\//);
    expect(imageGenerator.calls).toBe(1);

    expect(renderer.calls).toBe(SLIDE_COUNT);
  });

  it("falha no meio do pipeline sem avançar o step, e retoma exatamente dali", async () => {
    const textGenerator = new FakeTextGenerator([structureResponse, copyResponse]);
    const imageGenerator = new FakeImageGenerator();
    imageGenerator.failNextWith = new Error("provedor de imagem fora do ar");

    const { deps, projects, slides, jobs, renderer } = buildDeps(textGenerator, imageGenerator);

    const project = await projects.create({
      orgId: ORG_ID,
      clientId: CLIENT_ID,
      theme: "Como vender mais no Instagram",
      goal: "converter",
      slideCount: SLIDE_COUNT,
    });
    const job = await jobs.create({ orgId: ORG_ID, projectId: project.id });

    const worker = new PipelineWorker(deps);
    const failedResult = await worker.run(job.id);

    expect(failedResult.ok).toBe(false);

    const jobAfterFailure = await jobs.findById(job.id);
    expect(jobAfterFailure?.state).toBe("failed");
    // Chegou a rodar research (5) e copy (20) — a falha foi dentro de
    // "image", que ainda não tinha step próprio no %, então o progress
    // gravado é o do último step concluído (prompt, 40).
    expect(jobAfterFailure?.step).toBe("image");
    expect(jobAfterFailure?.progress).toBe(40);
    expect(jobAfterFailure?.attempts).toBe(1);
    expect(jobAfterFailure?.error).toContain("provedor de imagem fora do ar");

    const projectAfterFailure = await projects.findById(ORG_ID, project.id);
    expect(projectAfterFailure?.status).toBe("failed");

    // research/copy não são refeitos: nenhuma resposta nova foi
    // consumida da fila (ela já estava vazia) e mesmo assim o resume
    // funciona, provando que o checkpoint de "copy" foi reaproveitado.
    expect(renderer.calls).toBe(0);

    const resumedResult = await worker.run(job.id);
    expect(resumedResult.ok).toBe(true);

    const finishedJob = await jobs.findById(job.id);
    expect(finishedJob?.state).toBe("completed");
    expect(finishedJob?.attempts).toBe(1);

    const finalSlides = await slides.listByProject(project.id);
    expect(finalSlides.every((slide) => slide.mediaId !== null)).toBe(true);
    expect(renderer.calls).toBe(SLIDE_COUNT);
  });
});
