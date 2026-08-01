import { describe, expect, it } from "vitest";
import { GenerateCarouselUseCase } from "@/core/application/use-cases/generate-carousel";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";
import type { JobRepository } from "@/core/domain/ports/job-repository";
import type { QueuePort } from "@/core/domain/ports/queue";
import type { NewProject, Project, ProjectPatch } from "@/core/domain/project/project";
import type { Job, JobPatch, NewJob } from "@/core/domain/pipeline/job";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CLIENT_ID = "22222222-2222-4222-8222-222222222222";

class FakeProjectRepository implements ProjectRepository {
  readonly created: NewProject[] = [];

  async create(input: NewProject): Promise<Project> {
    this.created.push(input);
    const now = new Date(2026, 0, 1).toISOString();
    return {
      id: "project-1",
      orgId: input.orgId,
      clientId: input.clientId,
      theme: input.theme,
      goal: input.goal,
      status: "draft",
      progress: 0,
      slideCount: input.slideCount,
      ratio: input.ratio ?? "4:5",
      styleId: "nevoa-suave",
      format: "carousel" as const,
      mediaSource: null,
      caption: null,
      hashtags: [],
      cta: null,
      createdAt: now,
      updatedAt: now,
    };
  }
  async findById(): Promise<Project | null> {
    throw new Error("não usado neste teste");
  }
  async update(_orgId: string, _projectId: string, _patch: ProjectPatch): Promise<Project | null> {
    throw new Error("não usado neste teste");
  }
  async listByOrg(): Promise<Project[]> {
    throw new Error("não usado neste teste");
  }
}

class FakeJobRepository implements JobRepository {
  readonly created: NewJob[] = [];

  async create(input: NewJob): Promise<Job> {
    this.created.push(input);
    const now = new Date(2026, 0, 1).toISOString();
    return {
      id: "job-1",
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
  }
  async findById(): Promise<Job | null> {
    throw new Error("não usado neste teste");
  }
  async update(_jobId: string, _patch: JobPatch): Promise<Job | null> {
    throw new Error("não usado neste teste");
  }
}

class FakeQueue implements QueuePort {
  readonly enqueued: string[] = [];
  async enqueue(jobId: string): Promise<void> {
    this.enqueued.push(jobId);
  }
}

describe("GenerateCarouselUseCase (bloco 6)", () => {
  it("cria project + job e enfileira o pipeline", async () => {
    const projects = new FakeProjectRepository();
    const jobs = new FakeJobRepository();
    const queue = new FakeQueue();

    const result = await new GenerateCarouselUseCase(projects, jobs, queue).execute({
      orgId: ORG_ID,
      clientId: CLIENT_ID,
      theme: "Como vender mais no Instagram",
      goal: "converter",
      slideCount: 6,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.project.id).toBe("project-1");
    expect(result.value.jobId).toBe("job-1");
    expect(projects.created).toHaveLength(1);
    expect(jobs.created).toHaveLength(1);
    expect(queue.enqueued).toEqual(["job-1"]);
  });

  it("rejeita slideCount fora de 6 a 8", async () => {
    const projects = new FakeProjectRepository();
    const jobs = new FakeJobRepository();
    const queue = new FakeQueue();

    const result = await new GenerateCarouselUseCase(projects, jobs, queue).execute({
      orgId: ORG_ID,
      clientId: CLIENT_ID,
      theme: "Tema",
      goal: "educar",
      slideCount: 12,
    });

    expect(result.ok).toBe(false);
    expect(queue.enqueued).toHaveLength(0);
  });

  it("rejeita goal fora das 4 opções do Gerador", async () => {
    const projects = new FakeProjectRepository();
    const jobs = new FakeJobRepository();
    const queue = new FakeQueue();

    const result = await new GenerateCarouselUseCase(projects, jobs, queue).execute({
      orgId: ORG_ID,
      clientId: CLIENT_ID,
      theme: "Tema",
      // @ts-expect-error goal inválido de propósito
      goal: "vender",
      slideCount: 6,
    });

    expect(result.ok).toBe(false);
  });
});
