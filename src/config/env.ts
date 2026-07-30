import { z } from "zod";

const serverSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  HUGGINGFACE_API_KEY: z.string().min(1).optional(),
  TRIGGER_SECRET_KEY_DEV: z.string().min(1).optional(),
  TRIGGER_SECRET_KEY_PROD: z.string().min(1).optional(),
  RENDER_API_KEY: z.string().min(1).optional(),
  // Segredo compartilhado entre o app Next.js e o serviço de render
  // (src/infra/render/server.ts, bloco 5) — autentica as chamadas
  // HTTP entre os dois processos, já que o endpoint de screenshot roda
  // Puppeteer e não pode ficar público.
  RENDER_SERVICE_TOKEN: z.string().min(16).optional(),
  RENDER_SERVICE_PORT: z.coerce.number().int().positive().default(8080),
  // URL pública do serviço de render no Render.com — só o app Next.js
  // (Vercel) lê isto, para saber onde fazer o POST /render/slide em vez
  // de rodar Puppeteer no próprio processo (infra/render/http-render-slide-client.ts).
  RENDER_SERVICE_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

function parseServerEnv(): ServerEnv {
  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      `Variáveis de ambiente inválidas ou ausentes:\n${result.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n")}`,
    );
  }
  return result.data;
}

function parseClientEnv(): ClientEnv {
  const result = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!result.success) {
    throw new Error(
      `Variáveis de ambiente públicas inválidas ou ausentes:\n${result.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n")}`,
    );
  }
  return result.data;
}

// Só valida no servidor: no browser, process.env não tem as chaves privadas.
export const env: ServerEnv = typeof window === "undefined" ? parseServerEnv() : ({} as ServerEnv);
export const clientEnv: ClientEnv = parseClientEnv();
