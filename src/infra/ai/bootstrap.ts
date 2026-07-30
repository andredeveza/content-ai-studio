import "server-only";
import { env } from "@/config/env";
import { aiConfig } from "@/config/ai";
import { ProviderRegistry } from "@/infra/ai/registry";
import { FallbackPolicy } from "@/infra/ai/fallback";
import { SupabaseAILogger } from "@/infra/ai/logger";
import { SupabaseRateLimiter } from "@/infra/ai/rate-limiter";
import { AIGateway } from "@/infra/ai/gateway";
import { OpenRouterProvider } from "@/infra/ai/providers/openrouter/provider";
import { createKimiProvider } from "@/infra/ai/providers/kimi/provider";
import { createGeminiProvider } from "@/infra/ai/providers/gemini/provider";
import { createHuggingFaceProvider } from "@/infra/ai/providers/hf/provider";
import { createReplicateProvider } from "@/infra/ai/providers/replicate/provider";
import { createFalProvider } from "@/infra/ai/providers/fal/provider";

function buildRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry(aiConfig.fallbackOrder);

  if (env.OPENROUTER_API_KEY) {
    registry.register(
      new OpenRouterProvider({ apiKey: env.OPENROUTER_API_KEY, model: aiConfig.defaultTextModel }),
    );
  }
  registry.register(createKimiProvider());
  registry.register(createGeminiProvider());
  registry.register(createHuggingFaceProvider());
  registry.register(createReplicateProvider());
  registry.register(createFalProvider());

  return registry;
}

let gateway: AIGateway | undefined;

// Singleton por processo: o circuit breaker precisa manter estado entre
// chamadas, então cada `getAIGateway()` retorna a mesma instância.
export function getAIGateway(): AIGateway {
  if (!gateway) {
    gateway = new AIGateway(
      buildRegistry(),
      new FallbackPolicy(aiConfig.circuitBreaker),
      new SupabaseAILogger(),
      new SupabaseRateLimiter(aiConfig.budgets),
    );
  }
  return gateway;
}
