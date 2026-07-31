import JSZip from "jszip";
import { buildLegendaFile } from "@/core/application/services/legenda-file";
import type { RerenderSlideUseCase } from "@/core/application/use-cases/rerender-slide";
import type { MediaRepository } from "@/core/domain/ports/media-repository";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";
import type { SlideRepository } from "@/core/domain/ports/slide-repository";
import type { StoragePort } from "@/core/domain/ports/storage";
import type { Slide } from "@/core/domain/project/slide";
import { NotFoundError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

export interface ExportedProject {
  readonly path: string;
  readonly publicUrl: string;
}

// Bloco 9 (README, "Publicação"): zip com os PNGs de cada slide + o
// texto de legenda pronto. Slides com override (edição manual, bloco 8)
// são re-renderizados antes de zipar — sem isso, o zip poderia sair com
// um PNG de antes da edição, já que o Editor não re-renderiza a cada
// salvamento. Slides sem override já estão em dia desde o step "render"
// do pipeline (80%), então não pagamos Puppeteer de novo à toa.
export class ExportProjectUseCase {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly slides: SlideRepository,
    private readonly media: MediaRepository,
    private readonly mediaStorage: StoragePort,
    private readonly exportStorage: StoragePort,
    private readonly rerenderSlide: RerenderSlideUseCase,
  ) {}

  async execute(orgId: string, projectId: string): Promise<Result<ExportedProject, AppError>> {
    const project = await this.projects.findById(orgId, projectId);
    if (!project) return err(new NotFoundError(`Projeto ${projectId} não encontrado.`));

    const projectSlides = [...(await this.slides.listByProject(projectId))].sort((a, b) => a.index - b.index);
    if (projectSlides.length === 0) {
      return err(new NotFoundError(`Projeto ${projectId} ainda não tem slides.`));
    }

    const zip = new JSZip();
    const digits = String(projectSlides.length).length;

    for (const original of projectSlides) {
      let slide: Slide = original;

      if (slide.overrides) {
        const rerendered = await this.rerenderSlide.execute(orgId, slide.id);
        if (!rerendered.ok) return rerendered;
        slide = rerendered.value;
      }

      if (!slide.mediaId) {
        return err(new NotFoundError(`Slide ${slide.index + 1} do projeto ${projectId} ainda não foi renderizado.`));
      }

      const media = await this.media.findById(orgId, slide.mediaId);
      if (!media) return err(new NotFoundError(`Mídia do slide ${slide.index + 1} não encontrada.`));

      const png = await this.mediaStorage.download(media.path);
      const filename = `slide-${String(slide.index + 1).padStart(digits, "0")}.png`;
      zip.file(filename, png);
    }

    zip.file("legenda.txt", buildLegendaFile(project.caption, project.hashtags, project.cta));

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const path = `${orgId}/${projectId}/carrossel.zip`;
    const uploaded = await this.exportStorage.upload({ path, file: zipBuffer, contentType: "application/zip" });

    return ok({ path: uploaded.path, publicUrl: uploaded.publicUrl });
  }
}
