import { StartProjectSchema, type StartProjectInput } from "@/core/application/dto/project.dto";
import type { JobRepository } from "@/core/domain/ports/job-repository";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";
import type { QueuePort } from "@/core/domain/ports/queue";
import type { Project } from "@/core/domain/project/project";
import { ValidationError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

export interface GenerateCarouselResult {
  readonly project: Project;
  readonly jobId: string;
}

// Ponto de entrada do pipeline (README, "Pipeline de geração"). Cria
// `project` + `job` e dispara a fila — com o adapter inline (único
// implementado no bloco 6), `queue.enqueue` já roda o pipeline inteiro
// antes deste método retornar; o formato do retorno não muda quando um
// adapter assíncrono (trigger.dev) entrar depois.
export class GenerateCarouselUseCase {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly jobs: JobRepository,
    private readonly queue: QueuePort,
  ) {}

  async execute(input: StartProjectInput): Promise<Result<GenerateCarouselResult, AppError>> {
    const parsed = StartProjectSchema.safeParse(input);
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues.map((issue) => issue.message).join("; ")));
    }

    const project = await this.projects.create({
      orgId: parsed.data.orgId,
      clientId: parsed.data.clientId,
      theme: parsed.data.theme,
      goal: parsed.data.goal,
      slideCount: parsed.data.slideCount,
      ratio: parsed.data.ratio,
      styleId: parsed.data.styleId,
      format: parsed.data.format,
    });

    const job = await this.jobs.create({ orgId: parsed.data.orgId, projectId: project.id });

    await this.queue.enqueue(job.id);

    return ok({ project, jobId: job.id });
  }
}
