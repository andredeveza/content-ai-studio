// Entrypoint do serviço de render (README, "Renderização": "roda em
// serviço separado no Render.com — a Vercel não sustenta Chromium").
// Processo Node standalone, iniciado com `npm run render:server`
// (dev/local) ou pelo Dockerfile (deploy no Render.com), nunca importado
// pelo app Next.js — só chamado por HTTP.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { env } from "@/config/env";
import { logger } from "@/shared/logger";
import { UpsertBrandKitSchema } from "@/core/application/dto/brand-kit.dto";
import { buildSlideContentSchema } from "@/core/application/dto/slide-content.dto";
import { RenderSlideUseCase } from "@/core/application/use-cases/render-slide";
import { TemplateEngineService } from "@/core/application/services/template-engine.service";
import { PuppeteerRenderer } from "@/infra/render/puppeteer-renderer";
import { SupabaseStorage } from "@/infra/storage/supabase-storage";
import { SupabaseMediaRepository } from "@/infra/db/supabase/repositories/media-repository";
import { createAdminClient } from "@/infra/db/supabase/admin";
import { BLUEPRINTS, getBlueprint } from "@/templates/blueprints";
import type { ArchetypeId } from "@/core/domain/template/blueprint";
import type { BrandKit } from "@/core/domain/brandkit/brand-kit";

const RenderSlideRequestSchema = z.object({
  orgId: z.string().uuid(),
  key: z.string().min(1),
  archetypeId: z.string().min(1),
  canvas: z.object({ w: z.number().int().positive(), h: z.number().int().positive() }),
  isLastSlide: z.boolean().optional(),
  brandKit: UpsertBrandKitSchema,
  content: z.object({
    texts: z.record(z.string(), z.string()),
    media: z.record(z.string(), z.string()).optional(),
  }),
});

function isKnownArchetype(id: string): id is ArchetypeId {
  return Object.hasOwn(BLUEPRINTS, id);
}

function toFullBrandKit(input: z.infer<typeof UpsertBrandKitSchema>): BrandKit {
  const now = new Date().toISOString();
  return {
    id: "render-request",
    clientId: "render-request",
    palette: input.palette,
    gradient: input.gradient,
    fonts: input.fonts,
    logo: { path: null, radius: 0 },
    chrome: input.chrome,
    rules: input.rules,
    imageStyle: input.imageStyle ?? null,
    cta: input.cta,
    style: input.style ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(payload);
}

// Compara em tempo constante para não vazar o segredo por timing —
// endpoint aberto na internet, protegido só por este token.
function isAuthorized(req: IncomingMessage): boolean {
  if (!env.RENDER_SERVICE_TOKEN) return true; // dev sem token configurado
  const header = req.headers.authorization ?? "";
  const expected = `Bearer ${env.RENDER_SERVICE_TOKEN}`;
  const expectedBuf = Buffer.from(expected);
  const gotBuf = Buffer.from(header);
  if (gotBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(gotBuf, expectedBuf);
}

const renderer = new PuppeteerRenderer();
const templateEngine = new TemplateEngineService();

async function handleRenderSlide(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!isAuthorized(req)) {
    sendJson(res, 401, { error: "não autorizado" });
    return;
  }

  let rawBody: string;
  try {
    rawBody = await readBody(req);
  } catch {
    sendJson(res, 400, { error: "falha ao ler o corpo da requisição" });
    return;
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    sendJson(res, 400, { error: "corpo não é um JSON válido" });
    return;
  }

  const parsed = RenderSlideRequestSchema.safeParse(json);
  if (!parsed.success) {
    sendJson(res, 400, { error: "payload inválido", issues: parsed.error.issues });
    return;
  }

  const { archetypeId } = parsed.data;
  if (!isKnownArchetype(archetypeId)) {
    sendJson(res, 400, { error: `arquétipo desconhecido: ${archetypeId}` });
    return;
  }

  const contentSchema = buildSlideContentSchema(archetypeId);
  const contentParsed = contentSchema.safeParse(parsed.data.content);
  if (!contentParsed.success) {
    sendJson(res, 400, { error: "conteúdo não bate com os slots do arquétipo", issues: contentParsed.error.issues });
    return;
  }

  const db = createAdminClient();
  const useCase = new RenderSlideUseCase(
    templateEngine,
    renderer,
    new SupabaseStorage(db, "media"),
    new SupabaseMediaRepository(db),
  );

  const result = await useCase.execute({
    orgId: parsed.data.orgId,
    key: parsed.data.key,
    blueprint: getBlueprint(archetypeId),
    canvas: parsed.data.canvas,
    content: contentParsed.data,
    brandKit: toFullBrandKit(parsed.data.brandKit),
    isLastSlide: parsed.data.isLastSlide,
  });

  if (!result.ok) {
    logger.error("Falha ao renderizar slide", { code: result.error.code, message: result.error.message });
    sendJson(res, 502, { error: result.error.message, code: result.error.code });
    return;
  }

  sendJson(res, 200, {
    id: result.value.id,
    path: result.value.path,
    width: result.value.width,
    height: result.value.height,
  });
}

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (req.method === "POST" && req.url === "/render/slide") {
    void handleRenderSlide(req, res).catch((cause) => {
      logger.error("Erro não tratado em /render/slide", {
        error: cause instanceof Error ? cause.message : String(cause),
      });
      sendJson(res, 500, { error: "erro interno" });
    });
    return;
  }

  sendJson(res, 404, { error: "não encontrado" });
});

server.listen(env.RENDER_SERVICE_PORT, () => {
  logger.info(`Serviço de render ouvindo na porta ${env.RENDER_SERVICE_PORT}`);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    logger.info(`${signal} recebido, encerrando serviço de render`);
    server.close();
    void renderer.close().finally(() => process.exit(0));
  });
}
