import { env } from "@/config/env";
import { featureFlags } from "@/config/features";
import type { Capability } from "@/core/domain/ports/ai-provider";

export interface ProviderSlot {
  readonly id: string;
  readonly enabled: boolean;
}

export interface RateLimitBudgets {
  readonly perUserMonthlyUsd: number;
  readonly perOrgMonthlyUsd: number;
  readonly perProviderMonthlyUsd: number;
}

export interface CircuitBreakerConfig {
  readonly failureThreshold: number;
  readonly baseCooldownMs: number;
}

export interface AIConfig {
  readonly fallbackOrder: Record<Capability, readonly ProviderSlot[]>;
  readonly defaultTextModel: string;
  readonly budgets: RateLimitBudgets;
  readonly circuitBreaker: CircuitBreakerConfig;
}

// Ordem de fallback default (README, seção "AI Gateway"). Sobrescrevível
// por cliente em blocos futuros. No MVP (bloco 2) só openrouter roda de
// verdade — os demais ficam registrados e desligados por feature flag
// (config/features.ts).
export const aiConfig: AIConfig = {
  fallbackOrder: {
    text: [
      { id: "kimi", enabled: false },
      { id: "openrouter", enabled: Boolean(env.OPENROUTER_API_KEY) },
      { id: "gemini", enabled: false },
    ],
    image: [
      { id: "huggingface", enabled: featureFlags.aiProviderHuggingFace && Boolean(env.HUGGINGFACE_API_KEY) },
      { id: "replicate", enabled: false },
      { id: "fal", enabled: false },
    ],
    vision: [
      { id: "gemini", enabled: false },
      { id: "qwen-vl", enabled: false },
      { id: "florence", enabled: false },
    ],
    embed: [{ id: "huggingface", enabled: false }],
  },
  // Confirmado rodando de verdade em 2026-07-30:
  // "meta-llama/llama-3.3-70b-instruct:free" saiu do plano gratuito do
  // OpenRouter (404 — "use this slug instead: meta-llama/llama-3.3-70b-instruct",
  // a versão paga). Se o OpenRouter trocar de novo, reveja com
  // `curl https://openrouter.ai/api/v1/models` filtrando por ids que
  // terminam em ":free".
  defaultTextModel: "nvidia/nemotron-3-nano-30b-a3b:free",
  // Espelha o limite de crédito de US$5 do passo 3 do COLOCAR-NO-AR.md —
  // ajuste aqui quando o orçamento real do cliente for outro.
  budgets: {
    perUserMonthlyUsd: 5,
    perOrgMonthlyUsd: 5,
    perProviderMonthlyUsd: 5,
  },
  circuitBreaker: {
    failureThreshold: 3,
    baseCooldownMs: 30_000,
  },
};
