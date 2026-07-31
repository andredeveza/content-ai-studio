import type { RenderSlidePort } from "@/core/application/use-cases/render-slide";
import type { BrandKitRepository } from "@/core/domain/ports/brand-kit-repository";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";
import type { SlideRepository } from "@/core/domain/ports/slide-repository";
import { canvasForRatio } from "@/core/domain/project/project";
import { resolveEffectiveSlide, type Slide } from "@/core/domain/project/slide";
import { getBlueprint } from "@/templates/blueprints";
import { NotFoundError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

// Editor (bloco 8): depois de salvar um override, re-renderiza só esse
// slide (reusa o RenderSlidePort do bloco 5) — a miniatura no rail e o
// PNG final de exportação (bloco 9) sempre refletem a última edição.
export class RerenderSlideUseCase {
  constructor(
    private readonly slides: SlideRepository,
    private readonly projects: ProjectRepository,
    private readonly brandKits: BrandKitRepository,
    private readonly renderSlide: RenderSlidePort,
  ) {}

  async execute(orgId: string, slideId: string): Promise<Result<Slide, AppError>> {
    const slide = await this.slides.findById(slideId);
    if (!slide) return err(new NotFoundError(`Slide ${slideId} não encontrado.`));

    const project = await this.projects.findById(orgId, slide.projectId);
    if (!project) return err(new NotFoundError(`Projeto ${slide.projectId} não encontrado.`));

    const brandKit = await this.brandKits.findByClientId(project.clientId);
    if (!brandKit) return err(new NotFoundError(`Brand kit do cliente ${project.clientId} não encontrado.`));

    const effective = resolveEffectiveSlide(slide);
    const canvas = canvasForRatio(project.ratio);

    const result = await this.renderSlide.execute({
      orgId,
      key: `${project.id}/${slide.index}`,
      blueprint: getBlueprint(effective.archetypeId),
      canvas,
      content: effective.content,
      brandKit,
      isLastSlide: slide.index === project.slideCount - 1,
    });
    if (!result.ok) return result;

    const updated = await this.slides.setMediaId(slide.id, result.value.id);
    if (!updated) return err(new NotFoundError(`Slide ${slideId} sumiu ao re-renderizar.`));
    return ok(updated);
  }
}
