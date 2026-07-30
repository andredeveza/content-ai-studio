import { describe, expect, it } from "vitest";
import { AIGateway } from "@/infra/ai/gateway";
import { ProviderRegistry } from "@/infra/ai/registry";
import { FallbackPolicy } from "@/infra/ai/fallback";
import { ok, type Result } from "@/shared/result";
import type { AILogEntry, AILogger } from "@/infra/ai/logger";
import type { RateLimiter } from "@/infra/ai/rate-limiter";
import type { RateLimitError } from "@/shared/errors";
import type { AIProvider, TextInput, TextOutput } from "@/core/domain/ports/ai-provider";

class RecordingLogger implements AILogger {
  readonly entries: AILogEntry[] = [];
  async log(entry: AILogEntry): Promise<void> {
    this.entries.push(entry);
  }
}

class NoLimitRateLimiter implements RateLimiter {
  async checkBudget(): Promise<Result<void, RateLimitError>> {
    return ok(undefined);
  }
}

function flakyProvider(id: string): AIProvider {
  return {
    id,
    capabilities: ["text"],
    async generateText(): Promise<TextOutput> {
      throw new Error(`${id} está fora do ar`);
    },
    generateImage: () => {
      throw new Error("not used");
    },
    analyzeImage: () => {
      throw new Error("not used");
    },
    embed: () => {
      throw new Error("not used");
    },
    healthcheck: async () => false,
  };
}

function workingProvider(id: string): AIProvider {
  return {
    id,
    capabilities: ["text"],
    async generateText(input: TextInput): Promise<TextOutput> {
      return { text: `resposta de ${id} para: ${input.prompt}`, model: `${id}-model`, tokensInput: 10, tokensOutput: 20 };
    },
    generateImage: () => {
      throw new Error("not used");
    },
    analyzeImage: () => {
      throw new Error("not used");
    },
    embed: () => {
      throw new Error("not used");
    },
    healthcheck: async () => true,
  };
}

describe("AIGateway fallback + circuit breaker", () => {
  it("assume o próximo provider quando o primeiro falha", async () => {
    const registry = new ProviderRegistry({
      text: [
        { id: "primary", enabled: true },
        { id: "backup", enabled: true },
      ],
      image: [],
      vision: [],
      embed: [],
    });
    registry.register(flakyProvider("primary"));
    registry.register(workingProvider("backup"));

    const logger = new RecordingLogger();
    const gateway = new AIGateway(
      registry,
      new FallbackPolicy({ failureThreshold: 3, baseCooldownMs: 30_000 }),
      logger,
      new NoLimitRateLimiter(),
    );

    const result = await gateway.generateText(
      { prompt: "escreva um slide" },
      { orgId: "org-1", userId: "user-1" },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.model).toBe("backup-model");
    }

    expect(logger.entries).toHaveLength(2);
    expect(logger.entries[0]).toMatchObject({ provider: "primary", status: "error" });
    expect(logger.entries[1]).toMatchObject({ provider: "backup", status: "success", fallbackFrom: "primary" });
  });

  it("abre o circuito do provider após falhas repetidas e para de tentá-lo", async () => {
    const registry = new ProviderRegistry({
      text: [
        { id: "primary", enabled: true },
        { id: "backup", enabled: true },
      ],
      image: [],
      vision: [],
      embed: [],
    });
    registry.register(flakyProvider("primary"));
    registry.register(workingProvider("backup"));

    const policy = new FallbackPolicy({ failureThreshold: 2, baseCooldownMs: 30_000 });
    const gateway = new AIGateway(registry, policy, new RecordingLogger(), new NoLimitRateLimiter());

    for (let i = 0; i < 2; i += 1) {
      await gateway.generateText({ prompt: "tentativa" }, { orgId: "org-1", userId: "user-1" });
    }

    expect(policy.stateOf("primary")).toBe("open");

    // Terceira chamada: circuito de "primary" está aberto, o gateway nem
    // tenta chamá-lo — vai direto para "backup".
    const attemptLog: string[] = [];
    const registryTrackingCalls = new ProviderRegistry({
      text: [
        { id: "primary", enabled: true },
        { id: "backup", enabled: true },
      ],
      image: [],
      vision: [],
      embed: [],
    });
    registryTrackingCalls.register({
      ...flakyProvider("primary"),
      generateText: async () => {
        attemptLog.push("primary");
        throw new Error("não deveria ser chamado com o circuito aberto");
      },
    });
    registryTrackingCalls.register(workingProvider("backup"));

    const gatewayAfterOpen = new AIGateway(
      registryTrackingCalls,
      policy,
      new RecordingLogger(),
      new NoLimitRateLimiter(),
    );
    const result = await gatewayAfterOpen.generateText(
      { prompt: "tentativa 3" },
      { orgId: "org-1", userId: "user-1" },
    );

    expect(attemptLog).toHaveLength(0);
    expect(result.ok).toBe(true);
  });
});
