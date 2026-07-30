import type { BrandKit } from "@/core/domain/brandkit/brand-kit";
import type { Blueprint, Canvas } from "@/core/domain/template/blueprint";
import type { SlideContent } from "@/core/domain/template/slide-content";
import type { Media } from "@/core/domain/media/media";
import type { MediaRepository } from "@/core/domain/ports/media-repository";
import type { RenderPort } from "@/core/domain/ports/render";
import type { StoragePort } from "@/core/domain/ports/storage";
import type { TemplateEngineService } from "@/core/application/services/template-engine.service";
import { ExternalServiceError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

export interface RenderSlideInput {
  readonly orgId: string;
  // Caminho lógico do slide (ex.: "<projectId>/<slideIndex>") — o
  // formato é decidido por quem chama; `projects`/`slides` só existem a
  // partir do bloco 6.
  readonly key: string;
  readonly blueprint: Blueprint;
  readonly canvas: Canvas;
  readonly content: SlideContent;
  readonly brandKit: BrandKit;
  readonly isLastSlide?: boolean;
}

// Só os campos que quem chama (PipelineWorker) realmente usa depois —
// deixa `RenderSlidePort` implementável tanto local (Media completo)
// quanto via HTTP (resposta enxuta do serviço de render).
export interface RenderedSlide {
  readonly id: string;
  readonly path: string;
  readonly width: number;
  readonly height: number;
}

// Porta que o PipelineWorker (bloco 6) depende: local (esta classe, usada
// pelo próprio serviço de render e em testes) ou HTTP
// (infra/render/http-render-slide-client.ts, usada pelo app Next.js na
// Vercel — que não pode chamar Puppeteer no mesmo processo).
export interface RenderSlidePort {
  execute(input: RenderSlideInput): Promise<Result<RenderedSlide, AppError>>;
}

// README, "Renderização": monta o HTML (TemplateEngineService, bloco 4),
// tira o screenshot (RenderPort/Puppeteer), sobe o PNG pro Storage e
// grava o registro em `media`. Roda dentro do serviço de render (bloco
// 5) — nunca direto num processo Vercel.
export class RenderSlideUseCase implements RenderSlidePort {
  constructor(
    private readonly templateEngine: TemplateEngineService,
    private readonly renderer: RenderPort,
    private readonly storage: StoragePort,
    private readonly mediaRepository: MediaRepository,
  ) {}

  async execute(input: RenderSlideInput): Promise<Result<Media, AppError>> {
    const html = this.templateEngine.render(input.blueprint, input.canvas, input.content, input.brandKit, {
      isLastSlide: input.isLastSlide ?? false,
    });

    let png: Buffer;
    try {
      const output = await this.renderer.screenshot({ html, width: input.canvas.w, height: input.canvas.h });
      png = output.png;
    } catch (cause) {
      return err(new ExternalServiceError("Falha ao renderizar o slide com Puppeteer.", "puppeteer", cause));
    }

    const path = `${input.orgId}/${input.key}.png`;
    let uploaded: { path: string };
    try {
      uploaded = await this.storage.upload({ path, file: png, contentType: "image/png" });
    } catch (cause) {
      return err(new ExternalServiceError("Falha ao subir o PNG para o Storage.", "supabase-storage", cause));
    }

    const media = await this.mediaRepository.create({
      orgId: input.orgId,
      path: uploaded.path,
      kind: "slide-render",
      width: input.canvas.w,
      height: input.canvas.h,
      provider: "puppeteer",
    });

    return ok(media);
  }
}
