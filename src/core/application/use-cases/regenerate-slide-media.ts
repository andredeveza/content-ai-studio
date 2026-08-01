import type { PromptService } from "@/core/application/services/prompt.service";
import type { AIContext, AIImageGenerator } from "@/core/domain/ports/ai-text-generator";
import type { BrandKitRepository } from "@/core/domain/ports/brand-kit-repository";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";
import type { SlideRepository } from "@/core/domain/ports/slide-repository";
import { canvasForRatio } from "@/core/domain/project/project";
import { resolveEffectiveSlide, type Slide, type SlideOverrides } from "@/core/domain/project/slide";
import { getBlueprint } from "@/templates/blueprints";
import { blueprintContext } from "@/templates/context";
import { NotFoundError, ValidationError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

// Botão "Regerar imagem" do Editor (bloco 8): sempre gera uma imagem
// nova por IA — diferente do ImageService do pipeline (bloco 6), nunca
// tenta o acervo primeiro, porque o usuário já está pedindo uma imagem
// diferente da que está lá.
export class RegenerateSlideMediaUseCase {
  constructor(
    private readonly slides: SlideRepository,
    private readonly projects: ProjectRepository,
    private readonly brandKits: BrandKitRepository,
    private readonly imageGenerator: AIImageGenerator,
    private readonly prompt: PromptService,
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
    const mediaKey = getBlueprint(effective.archetypeId)
      .slots(blueprintContext(canvas))
      .find((slot) => slot.kind === "media")?.key;
    if (!mediaKey) {
      return err(new ValidationError(`Arquétipo "${effective.archetypeId}" não tem slot de mídia.`));
    }

    const heading = effective.content.texts.heading ?? effective.content.texts.quote ?? project.theme;
    const promptText = this.prompt.buildPrompt(brandKit, {
      index: slide.index,
      kicker: "",
      heading,
      lead: "",
      body: heading,
      quote: "",
      author: "",
      number: "",
      items: [],
      day: "",
      month: "",
      detail: "",
      ctaLabel: "",
    });

    const ctx: AIContext = { orgId, userId: null };
    const generated = await this.imageGenerator.generateImage({ prompt: promptText }, ctx);
    if (!generated.ok) return generated;

    const newOverrides: SlideOverrides = {
      ...slide.overrides,
      media: { ...slide.overrides?.media, [mediaKey]: generated.value.imageUrl },
    };

    const updated = await this.slides.updateOverrides(slide.id, newOverrides);
    if (!updated) return err(new NotFoundError(`Slide ${slideId} sumiu ao regerar a imagem.`));
    return ok(updated);
  }
}
