import "server-only";
import { z } from "zod";
import type {
  AIProvider,
  Capability,
  EmbedInput,
  EmbedOutput,
  ImageInput,
  ImageOutput,
  TextInput,
  TextOutput,
  VisionInput,
  VisionOutput,
} from "@/core/domain/ports/ai-provider";
import { AllProvidersFailedError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";
import { estimateTextCostUsd } from "@/infra/ai/pricing";
import type { ProviderRegistry } from "@/infra/ai/registry";
import type { FallbackPolicy } from "@/infra/ai/fallback";
import type { AILogger } from "@/infra/ai/logger";
import type { RateLimiter } from "@/infra/ai/rate-limiter";

export interface GatewayContext {
  readonly orgId: string;
  readonly userId: string | null;
}

export class AIGateway {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly policy: FallbackPolicy,
    private readonly logger: AILogger,
    private readonly limiter: RateLimiter,
  ) {}

  async generateText(input: TextInput, ctx: GatewayContext): Promise<Result<TextOutput, AppError>> {
    return this.run("text", ctx, (provider) => provider.generateText(input), (output) =>
      estimateTextCostUsd(output.model, output.tokensInput, output.tokensOutput),
    );
  }

  // Valida o texto gerado (JSON) contra um schema Zod antes de expor ao
  // domínio — README, regra não negociável nº4.
  async generateStructured<T>(
    input: TextInput,
    schema: z.ZodType<T>,
    ctx: GatewayContext,
  ): Promise<Result<T, AppError>> {
    const textResult = await this.generateText(input, ctx);
    if (!textResult.ok) return textResult;

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(textResult.value.text);
    } catch (cause) {
      return err(
        new AllProvidersFailedError("Resposta do provedor não é um JSON válido.", [
          { provider: "unknown", error: String(cause) },
        ]),
      );
    }

    const validated = schema.safeParse(parsedJson);
    if (!validated.success) {
      return err(
        new AllProvidersFailedError("Resposta do provedor falhou a validação de schema.", [
          { provider: "unknown", error: validated.error.message },
        ]),
      );
    }

    return ok(validated.data);
  }

  async generateImage(input: ImageInput, ctx: GatewayContext): Promise<Result<ImageOutput, AppError>> {
    return this.run("image", ctx, (provider) => provider.generateImage(input), () => 0);
  }

  async analyzeImage(input: VisionInput, ctx: GatewayContext): Promise<Result<VisionOutput, AppError>> {
    return this.run("vision", ctx, (provider) => provider.analyzeImage(input), () => 0);
  }

  async embed(input: EmbedInput, ctx: GatewayContext): Promise<Result<EmbedOutput, AppError>> {
    return this.run("embed", ctx, (provider) => provider.embed(input), () => 0);
  }

  private async run<T extends { model: string }>(
    capability: Capability,
    ctx: GatewayContext,
    call: (provider: AIProvider) => Promise<T>,
    estimateCost: (output: T) => number,
  ): Promise<Result<T, AppError>> {
    const providers = this.registry.enabledFor(capability);
    const attempts: { provider: string; error: string }[] = [];
    let fallbackFrom: string | undefined;

    for (const provider of providers) {
      const rateLimitCheck = await this.limiter.checkBudget({
        orgId: ctx.orgId,
        userId: ctx.userId,
        providerId: provider.id,
      });
      if (!rateLimitCheck.ok) {
        attempts.push({ provider: provider.id, error: rateLimitCheck.error.message });
        continue;
      }

      if (!this.policy.canAttempt(provider.id)) {
        attempts.push({ provider: provider.id, error: "circuit breaker aberto" });
        continue;
      }

      const startedAt = Date.now();
      try {
        const output = await call(provider);
        const latencyMs = Date.now() - startedAt;
        this.policy.recordSuccess(provider.id);

        void this.logger.log({
          orgId: ctx.orgId,
          userId: ctx.userId,
          provider: provider.id,
          model: output.model,
          task: capability,
          status: "success",
          costUsd: estimateCost(output),
          latencyMs,
          fallbackFrom,
        });

        return ok(output);
      } catch (cause) {
        const latencyMs = Date.now() - startedAt;
        const message = cause instanceof Error ? cause.message : String(cause);
        this.policy.recordFailure(provider.id);
        attempts.push({ provider: provider.id, error: message });

        void this.logger.log({
          orgId: ctx.orgId,
          userId: ctx.userId,
          provider: provider.id,
          model: null,
          task: capability,
          status: "error",
          costUsd: 0,
          latencyMs,
          fallbackFrom,
          error: message,
        });

        fallbackFrom = provider.id;
      }
    }

    return err(
      new AllProvidersFailedError(
        providers.length === 0
          ? `Nenhum provider habilitado para a capability "${capability}".`
          : `Todos os providers falharam para a capability "${capability}".`,
        attempts,
      ),
    );
  }
}

