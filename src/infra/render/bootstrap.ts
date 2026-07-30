import "server-only";
import { env } from "@/config/env";
import { RenderSlideUseCase, type RenderSlidePort } from "@/core/application/use-cases/render-slide";
import { TemplateEngineService } from "@/core/application/services/template-engine.service";
import { HttpRenderSlideClient } from "@/infra/render/http-render-slide-client";
import { PuppeteerRenderer } from "@/infra/render/puppeteer-renderer";
import { SupabaseStorage } from "@/infra/storage/supabase-storage";
import { SupabaseMediaRepository } from "@/infra/db/supabase/repositories/media-repository";
import { createAdminClient } from "@/infra/db/supabase/admin";

// Escolhe a implementação de RenderSlidePort conforme o ambiente: HTTP
// pro serviço separado do Render.com quando `RENDER_SERVICE_URL` está
// configurada (é o caso do app Next.js na Vercel — que não sustenta
// Chromium); local (Puppeteer no mesmo processo) quando não está — só
// faz sentido rodando tudo numa máquina só, nunca em produção na Vercel.
export function getRenderSlidePort(): RenderSlidePort {
  if (env.RENDER_SERVICE_URL) {
    return new HttpRenderSlideClient({ baseUrl: env.RENDER_SERVICE_URL, token: env.RENDER_SERVICE_TOKEN });
  }

  const db = createAdminClient();
  return new RenderSlideUseCase(
    new TemplateEngineService(),
    new PuppeteerRenderer(),
    new SupabaseStorage(db, "media"),
    new SupabaseMediaRepository(db),
  );
}
