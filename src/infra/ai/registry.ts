import type { AIProvider, Capability } from "@/core/domain/ports/ai-provider";
import type { ProviderSlot } from "@/config/ai";

export class ProviderRegistry {
  private readonly providers = new Map<string, AIProvider>();

  constructor(private readonly fallbackOrder: Record<Capability, readonly ProviderSlot[]>) {}

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId);
  }

  // Providers habilitados para a capability, na ordem de fallback
  // configurada (config/ai.ts em produção). Um provider registrado mas
  // desligado por flag (enabled: false) nunca aparece aqui.
  enabledFor(capability: Capability): AIProvider[] {
    return this.fallbackOrder[capability]
      .filter((slot) => slot.enabled)
      .map((slot) => this.providers.get(slot.id))
      .filter((provider): provider is AIProvider => Boolean(provider))
      .filter((provider) => provider.capabilities.includes(capability));
  }
}
