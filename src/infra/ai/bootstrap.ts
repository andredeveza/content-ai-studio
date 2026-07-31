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
import { createAdminClient } from "@/infra/db/supabase/admin";
import { SupabaseStorage } from "@/infra/storage/supabase-storage";

function buildRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry(aiConfig.fallbackOrder);

  if (env.OPENROUTER_API_KEY) {
    registry.register(
      new OpenRouterProvider({ apiKey: env.OPENROUTER_API_KEY, model: aiConfig.defaultTextModel }),
    );
  }
  registry.register(createKimiProvider());
  registry.register(createGeminiProvider());
  if (env.HUGGINGFACE_API_KEY) {
    // Bucket "media" (bloco 5) — a imagem gerada some dentro do PNG
    // final do slide de qualquer forma, não precisa de bucket próprio.
    const storage = new SupabaseStorage(createAdminClient(), "media");
    registry.register(createHuggingFaceProvider({ apiKey: env.HUGGINGFACE_API_KEY, storage }));
  }
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
