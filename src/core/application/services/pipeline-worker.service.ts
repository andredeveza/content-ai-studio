import type { ProjectCopy } from "@/core/application/dto/copy.dto";
import type { ImageService } from "@/core/application/services/image.service";
import type { CopyService } from "@/core/application/services/copy.service";
import type { PromptService } from "@/core/application/services/prompt.service";
import type { ProjectStructure, ResearchService } from "@/core/application/services/research.service";
import { mapGenericCopyToSlideContent } from "@/core/application/services/slide-content-mapper";
import { selectLayout } from "@/core/application/services/layout.service";
import type { RenderSlidePort } from "@/core/application/use-cases/render-slide";
import type { BrandKitRepository } from "@/core/domain/ports/brand-kit-repository";
import type { ClientRepository } from "@/core/domain/ports/client-repository";
import type { JobRepository } from "@/core/domain/ports/job-repository";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";
import type { PublishingGateway } from "@/core/domain/ports/publisher";
import type { SlideRepository } from "@/core/domain/ports/slide-repository";
import { JOB_STEPS, JOB_STEP_PROGRESS, type Job, type JobCheckpoint, type JobStep } from "@/core/domain/pipeline/job";
import { canvasForRatio, type Project } from "@/core/domain/project/project";
import type { NewSlide } from "@/core/domain/project/slide";
import type { SlideContent } from "@/core/domain/template/slide-content";
import { getBlueprint } from "@/templates/blueprints";
import { AppError, ExternalServiceError, NotFoundError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

export interface PipelineWorkerDeps {
  readonly jobs: JobRepository;
  readonly projects: ProjectRepository;
  readonly slides: SlideRepository;
  readonly clients: ClientRepository;
  readonly brandKits: BrandKitRepository;
  readonly research: ResearchService;
  readonly copy: CopyService;
  readonly prompt: PromptService;
  readonly image: ImageService;
  readonly renderSlide: RenderSlidePort;
  readonly publisher: PublishingGateway;
}

// README, "Pipeline de geração": sete steps idempotentes com checkpoint
// persistido em `jobs.payload`. Roda inline (bloco 6) — o mesmo worker
// serviria um adapter trigger.dev sem mudar nada aqui, só quem chama
// `run(jobId)`.
export class PipelineWorker {
  constructor(private readonly deps: PipelineWorkerDeps) {}

  async run(jobId: string): Promise<Result<void, AppError>> {
    const job = await this.deps.jobs.findById(jobId);
    if (!job) return err(new NotFoundError(`Job ${jobId} não encontrado.`));

    try {
      await this.deps.jobs.update(jobId, { state: "running" });

      let current = job;
      const startIndex = JOB_STEPS.indexOf(current.step);
      for (const step of JOB_STEPS.slice(startIndex)) {
        current = await this.runStep(current, step);
      }

      return ok(undefined);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      const latest = await this.deps.jobs.findById(jobId);
      await this.deps.jobs.update(jobId, {
        state: "failed",
        attempts: (latest?.attempts ?? job.attempts) + 1,
        error: message,
      });
      await this.deps.projects.update(job.orgId, job.projectId, { status: "failed" });
      return err(cause instanceof AppError ? cause : new ExternalServiceError(message, "pipeline", cause));
    }
  }

  private async runStep(job: Job, step: JobStep): Promise<Job> {
    switch (step) {
      case "research":
        return this.runResearch(job);
      case "copy":
        return this.runCopy(job);
      case "prompt":
        return this.runPrompt(job);
      case "image":
        return this.runImage(job);
      case "render":
        return this.runRender(job);
      case "publish":
        return this.runPublish(job);
      case "completed":
        return this.runCompleted(job);
    }
  }

  // Progresso reflete o step que ACABOU de terminar (job.step ainda
  // aponta pra ele quando `advance` é chamado) — `nextStep` só entra em
  // `jobs.step` depois que o step atual já persistiu seu resultado, que é
  // o que garante retomar do step certo em caso de falha.
  private async advance(job: Job, nextStep: JobStep, payload: JobCheckpoint): Promise<Job> {
    const progress = JOB_STEP_PROGRESS[job.step];
    const updated = await this.deps.jobs.update(job.id, { step: nextStep, payload, progress, state: "running" });
    if (!updated) throw new Error(`Job ${job.id} sumiu durante o pipeline.`);
    await this.deps.projects.update(job.orgId, job.projectId, { progress });
    return updated;
  }

  private async requireProject(job: Job): Promise<Project> {
    const project = await this.deps.projects.findById(job.orgId, job.projectId);
    if (!project) throw new NotFoundError(`Projeto ${job.projectId} não encontrado.`);
    return project;
  }

  // Step "research" (5%).
  private async runResearch(job: Job): Promise<Job> {
    const project = await this.requireProject(job);
    const result = await this.deps.research.buildStructure(project.theme, project.goal, project.slideCount, {
      orgId: job.orgId,
      userId: null,
    });
    if (!result.ok) throw result.error;

    return this.advance(job, "copy", { ...job.payload, structure: result.value });
  }

  // Step "copy" (20%) — inclui o SelectLayout (bloco 4): roda aqui, antes
  // de Prompt/Image, para não gerar prompt/imagem de slides cujo
  // arquétipo escolhido não tem slot de mídia. O README só diz "antes de
  // renderizar"; rodar mais cedo não contradiz isso.
  private async runCopy(job: Job): Promise<Job> {
    const project = await this.requireProject(job);
    const client = await this.deps.clients.findById(job.orgId, project.clientId);
    if (!client) throw new NotFoundError(`Cliente ${project.clientId} não encontrado.`);

    const structure = job.payload.structure as ProjectStructure;
    const result = await this.deps.copy.write(structure, client.persona, client.tone, {
      orgId: job.orgId,
      userId: null,
    });
    if (!result.ok) throw result.error;

    const projectCopy = result.value;

    const newSlides: NewSlide[] = projectCopy.slides.map((copy) => {
      const stepNumber = copy.number ? Number.parseInt(copy.number, 10) : Number.NaN;
      const archetypeId = selectLayout({
        slideIndex: copy.index,
        totalSlides: projectCopy.slides.length,
        stepNumber: Number.isFinite(stepNumber) ? stepNumber : null,
        body: copy.body || copy.heading,
        items: copy.items,
        // Sem RetrieveAssets real (bloco 7), nunca força "foto-total" por
        // conta própria — evita escolher um arquétipo que precisa de
        // mídia forte quando não há acervo nenhum ainda.
        hasStrongPhoto: false,
      });
      return { index: copy.index, archetypeId, content: mapGenericCopyToSlideContent(archetypeId, copy) };
    });

    await this.deps.slides.upsertMany(project.id, newSlides);
    await this.deps.projects.update(job.orgId, project.id, {
      caption: projectCopy.caption,
      hashtags: projectCopy.hashtags,
      cta: projectCopy.cta,
    });

    return this.advance(job, "prompt", { ...job.payload, copy: projectCopy });
  }

  // Step "prompt" (40%): só para slides cujo arquétipo tem slot de
  // mídia.
  private async runPrompt(job: Job): Promise<Job> {
    const project = await this.requireProject(job);
    const brandKit = await this.deps.brandKits.findByClientId(project.clientId);
    if (!brandKit) throw new NotFoundError(`Brand kit do cliente ${project.clientId} não encontrado.`);

    const projectCopy = job.payload.copy as ProjectCopy;
    const canvas = canvasForRatio(project.ratio);
    const slides = await this.deps.slides.listByProject(project.id);

    const prompts: Record<number, string> = {};
    for (const slide of slides) {
      const hasMediaSlot = getBlueprint(slide.archetypeId)
        .slots(canvas)
        .some((slot) => slot.kind === "media");
      if (!hasMediaSlot) continue;

      const slideCopy = projectCopy.slides.find((c) => c.index === slide.index);
      if (!slideCopy) continue;

      prompts[slide.index] = this.deps.prompt.buildPrompt(brandKit, slideCopy);
    }

    return this.advance(job, "image", { ...job.payload, prompts });
  }

  // Step "image" (60%, "+ RetrievalService antes" — README).
  private async runImage(job: Job): Promise<Job> {
    const project = await this.requireProject(job);
    const projectCopy = job.payload.copy as ProjectCopy;
    const prompts = job.payload.prompts ?? {};

    const mediaUrls: Record<number, string> = {};
    for (const [indexKey, prompt] of Object.entries(prompts)) {
      const index = Number(indexKey);
      const slideCopy = projectCopy.slides.find((c) => c.index === index);
      const brief = slideCopy?.body || slideCopy?.heading || "";

      const result = await this.deps.image.resolveMediaUrl(project.clientId, prompt, brief, {
        orgId: job.orgId,
        userId: null,
      });
      if (!result.ok) throw result.error;
      mediaUrls[index] = result.value;
    }

    const canvas = canvasForRatio(project.ratio);
    const slides = await this.deps.slides.listByProject(project.id);
    for (const slide of slides) {
      const url = mediaUrls[slide.index];
      if (!url) continue;

      const mediaKey = getBlueprint(slide.archetypeId)
        .slots(canvas)
        .find((slot) => slot.kind === "media")?.key;
      if (!mediaKey) continue;

      const content: SlideContent = { ...slide.content, media: { ...slide.content.media, [mediaKey]: url } };
      await this.deps.slides.updateContent(slide.id, content);
    }

    return this.advance(job, "render", { ...job.payload, mediaUrls });
  }

  // Step "render" (80%) — reusa o RenderSlideUseCase do bloco 5 por
  // slide.
  private async runRender(job: Job): Promise<Job> {
    const project = await this.requireProject(job);
    const brandKit = await this.deps.brandKits.findByClientId(project.clientId);
    if (!brandKit) throw new NotFoundError(`Brand kit do cliente ${project.clientId} não encontrado.`);

    const canvas = canvasForRatio(project.ratio);
    const slides = [...(await this.deps.slides.listByProject(project.id))].sort((a, b) => a.index - b.index);

    for (const slide of slides) {
      const result = await this.deps.renderSlide.execute({
        orgId: job.orgId,
        key: `${project.id}/${slide.index}`,
        blueprint: getBlueprint(slide.archetypeId),
        canvas,
        content: slide.content,
        brandKit,
        isLastSlide: slide.index === slides.length - 1,
      });
      if (!result.ok) throw result.error;

      await this.deps.slides.setMediaId(slide.id, result.value.id);
    }

    return this.advance(job, "publish", job.payload);
  }

  // Step "publish" (95%) — README: "no MVP só o canal export", que só
  // chega no bloco 9. `NoopPublisher` mantém o step real sem publicar
  // nada ainda.
  private async runPublish(job: Job): Promise<Job> {
    await this.deps.publisher.publish({ projectId: job.projectId });
    return this.advance(job, "completed", job.payload);
  }

  // "Concluído" (100%, job.completed — README).
  private async runCompleted(job: Job): Promise<Job> {
    await this.deps.projects.update(job.orgId, job.projectId, { status: "completed", progress: 100 });
    const updated = await this.deps.jobs.update(job.id, { state: "completed", progress: 100 });
    if (!updated) throw new Error(`Job ${job.id} sumiu ao concluir o pipeline.`);
    return updated;
  }
}
