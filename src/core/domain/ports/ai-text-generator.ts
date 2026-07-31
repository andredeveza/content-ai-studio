import type { z } from "zod";
import type { EmbedInput, EmbedOutput, ImageInput, ImageOutput, TextInput } from "@/core/domain/ports/ai-provider";
import type { AppError } from "@/shared/errors";
import type { Result } from "@/shared/result";

// Contexto de orçamento/rate-limit (mesmo formato de GatewayContext em
// infra/ai/gateway.ts — duplicado aqui de propósito: core/application
// não importa infra/, `AIGateway` implementa esta porta estruturalmente
// sem precisar declarar isso).
export interface AIContext {
  readonly orgId: string;
  readonly userId: string | null;
}

// Subconjunto de AIGateway que os services do pipeline (Research, Copy)
// precisam: gerar texto validado por Zod (regra não negociável nº4).
export interface AITextGenerator {
  generateStructured<T>(input: TextInput, schema: z.ZodType<T>, ctx: AIContext): Promise<Result<T, AppError>>;
}

// Subconjunto que o ImageService precisa.
export interface AIImageGenerator {
  generateImage(input: ImageInput, ctx: AIContext): Promise<Result<ImageOutput, AppError>>;
}

// Subconjunto que AnalyzeAssetUseCase usa pra indexar trechos de PDF
// (README, "Indexação": "embedding semântico dos trechos para texto") —
// opcional, porque só funciona quando um provider com capability
// "embed" estiver ligado (Hugging Face é feature-flag desligada por
// padrão no MVP).
export interface TextEmbedder {
  embed(input: EmbedInput, ctx: AIContext): Promise<Result<EmbedOutput, AppError>>;
}
