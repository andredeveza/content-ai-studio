import { SlideOverridesPatchSchema, type SlideOverridesPatchInput } from "@/core/application/dto/slide-overrides.dto";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";
import type { SlideRepository } from "@/core/domain/ports/slide-repository";
import type { Slide, SlideOverrides } from "@/core/domain/project/slide";
import { NotFoundError, ValidationError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

// Editor (bloco 8): grava a edição manual por cima do que o pipeline
// gerou — nunca abaixo os `texts`/`media` que já existiam, só mescla o
// que veio no patch (regra do PATCH parcial: campo ausente = mantém).
// `orgId` é obrigatório e checado contra o projeto do slide — sem isso,
// qualquer usuário autenticado que soubesse/adivinhasse um `slideId`
// poderia editar o slide de outra org.
export class UpdateSlideOverridesUseCase {
  constructor(
    private readonly slides: SlideRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(orgId: string, slideId: string, patch: SlideOverridesPatchInput): Promise<Result<Slide, AppError>> {
    const parsed = SlideOverridesPatchSchema.safeParse(patch);
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues.map((issue) => issue.message).join("; ")));
    }

    const existing = await this.slides.findById(slideId);
    if (!existing) return err(new NotFoundError(`Slide ${slideId} não encontrado.`));

    const project = await this.projects.findById(orgId, existing.projectId);
    if (!project) return err(new NotFoundError(`Slide ${slideId} não encontrado.`));

    const merged: SlideOverrides = {
      archetypeId: parsed.data.archetypeId ?? existing.overrides?.archetypeId,
      texts: { ...existing.overrides?.texts, ...parsed.data.texts },
      media: { ...existing.overrides?.media, ...parsed.data.media },
    };

    const updated = await this.slides.updateOverrides(slideId, merged);
    if (!updated) return err(new NotFoundError(`Slide ${slideId} sumiu ao salvar os ajustes.`));
    return ok(updated);
  }
}
