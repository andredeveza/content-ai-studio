import { describe, expect, it } from "vitest";
import { SchedulePostUseCase } from "@/core/application/use-cases/schedule-post";
import type { CalendarPost, NewPost, Post, PostStatus } from "@/core/domain/post/post";
import type { PostRepository } from "@/core/domain/ports/post-repository";
import type { NewProject, Project, ProjectPatch } from "@/core/domain/project/project";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";

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

class FakePostRepository implements PostRepository {
  readonly created: NewPost[] = [];
  async upsertSchedule(input: NewPost): Promise<Post> {
    this.created.push(input);
    return {
      id: "post-1",
      orgId: input.orgId,
      projectId: input.projectId,
      scheduledAt: input.scheduledAt,
      status: "scheduled",
      channelTargets: input.channelTargets ?? ["export"],
      createdAt: now,
      updatedAt: now,
    };
  }
  async findByProjectId(): Promise<Post | null> {
    throw new Error("não usado");
  }
  async updateStatus(_orgId: string, _postId: string, _status: PostStatus): Promise<Post | null> {
    throw new Error("não usado");
  }
  async delete(): Promise<boolean> {
    throw new Error("não usado");
  }
  async listForCalendar(): Promise<CalendarPost[]> {
    throw new Error("não usado");
  }
}

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
    caption: null,
    hashtags: [],
    cta: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("SchedulePostUseCase (bloco 10)", () => {
  it("agenda um projeto já concluído", async () => {
    const posts = new FakePostRepository();
    const projects = new FakeProjectRepository(makeProject());
    const useCase = new SchedulePostUseCase(posts, projects);

    const result = await useCase.execute(ORG_ID, "project-1", { scheduledAt: "2026-08-12T19:00:00Z" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.scheduledAt).toBe("2026-08-12T19:00:00Z");
    expect(posts.created[0]?.projectId).toBe("project-1");
  });

  it("rejeita agendar um projeto que ainda não terminou de gerar", async () => {
    const posts = new FakePostRepository();
    const projects = new FakeProjectRepository(makeProject({ status: "running" }));
    const useCase = new SchedulePostUseCase(posts, projects);

    const result = await useCase.execute(ORG_ID, "project-1", { scheduledAt: "2026-08-12T19:00:00Z" });

    expect(result.ok).toBe(false);
    expect(posts.created).toHaveLength(0);
  });

  it("rejeita data inválida", async () => {
    const posts = new FakePostRepository();
    const projects = new FakeProjectRepository(makeProject());
    const useCase = new SchedulePostUseCase(posts, projects);

    const result = await useCase.execute(ORG_ID, "project-1", { scheduledAt: "não é uma data" });

    expect(result.ok).toBe(false);
  });

  it("rejeita quando o projeto pertence a outra org", async () => {
    const posts = new FakePostRepository();
    const projects = new FakeProjectRepository(makeProject());
    const useCase = new SchedulePostUseCase(posts, projects);

    const result = await useCase.execute("outra-org", "project-1", { scheduledAt: "2026-08-12T19:00:00Z" });

    expect(result.ok).toBe(false);
  });
});
