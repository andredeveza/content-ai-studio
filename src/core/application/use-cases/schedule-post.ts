import { SchedulePostSchema, type SchedulePostInput } from "@/core/application/dto/post.dto";
import type { PostRepository } from "@/core/domain/ports/post-repository";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";
import type { Post } from "@/core/domain/post/post";
import { NotFoundError, ValidationError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

// Bloco 10 (README, Editor: "Agendar publicação"). Só agenda um projeto
// que já terminou de gerar — não faz sentido agendar um carrossel que
// ainda está rodando ou falhou, ele não tem PNG nenhum pra publicar.
export class SchedulePostUseCase {
  constructor(
    private readonly posts: PostRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(orgId: string, projectId: string, input: SchedulePostInput): Promise<Result<Post, AppError>> {
    const parsed = SchedulePostSchema.safeParse(input);
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues.map((issue) => issue.message).join("; ")));
    }

    const project = await this.projects.findById(orgId, projectId);
    if (!project) return err(new NotFoundError(`Projeto ${projectId} não encontrado.`));
    if (project.status !== "completed") {
      return err(new ValidationError("Só é possível agendar um carrossel que já terminou de gerar."));
    }

    const post = await this.posts.upsertSchedule({
      orgId,
      projectId,
      scheduledAt: parsed.data.scheduledAt,
    });

    return ok(post);
  }
}
