import "server-only";
import type {
  RenderedSlide,
  RenderSlideInput,
  RenderSlidePort,
} from "@/core/application/use-cases/render-slide";
import { ExternalServiceError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

export interface HttpRenderSlideClientOptions {
  readonly baseUrl: string;
  readonly token?: string;
}

// Implementação de RenderSlidePort usada pelo app Next.js na Vercel — que
// não sustenta Chromium (README, "Renderização"). Em vez de rodar
// Puppeteer no mesmo processo, faz POST no serviço separado do Render.com
// (src/infra/render/server.ts, bloco 5) e devolve só o que o
// PipelineWorker usa depois (RenderedSlide).
export class HttpRenderSlideClient implements RenderSlidePort {
  constructor(private readonly options: HttpRenderSlideClientOptions) {}

  async execute(input: RenderSlideInput): Promise<Result<RenderedSlide, AppError>> {
    const body = {
      orgId: input.orgId,
      key: input.key,
      archetypeId: input.blueprint.id,
      canvas: input.canvas,
      isLastSlide: input.isLastSlide ?? false,
      content: input.content,
      brandKit: {
        palette: input.brandKit.palette,
        gradient: input.brandKit.gradient,
        fonts: input.brandKit.fonts,
        chrome: input.brandKit.chrome,
        rules: input.brandKit.rules,
        imageStyle: input.brandKit.imageStyle,
        cta: input.brandKit.cta,
        style: input.brandKit.style,
      },
    };

    let response: Response;
    try {
      response = await fetch(`${this.options.baseUrl}/render/slide`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.options.token ? { authorization: `Bearer ${this.options.token}` } : {}),
        },
        body: JSON.stringify(body),
      });
    } catch (cause) {
      return err(new ExternalServiceError("Falha ao chamar o serviço de render.", "render-service", cause));
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return err(
        new ExternalServiceError(
          `Serviço de render respondeu ${response.status}: ${detail}`,
          "render-service",
        ),
      );
    }

    const json = (await response.json()) as RenderedSlide;
    return ok(json);
  }
}
