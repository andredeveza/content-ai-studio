import "server-only";
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
import { ExternalServiceError } from "@/shared/errors";

// Provider registrado mas desligado por feature flag (config/features.ts).
// Existe para reservar o lugar na ordem de fallback; nenhum método deveria
// ser chamado enquanto a flag estiver false, porque o registry só inclui
// providers habilitados em `enabledFor()`.
export class StubProvider implements AIProvider {
  constructor(
    readonly id: string,
    readonly capabilities: readonly Capability[],
  ) {}

  private notConfigured(): never {
    throw new ExternalServiceError(`Provider "${this.id}" está desligado por feature flag.`, this.id);
  }

  generateText(_input: TextInput): Promise<TextOutput> {
    this.notConfigured();
  }

  generateImage(_input: ImageInput): Promise<ImageOutput> {
    this.notConfigured();
  }

  analyzeImage(_input: VisionInput): Promise<VisionOutput> {
    this.notConfigured();
  }

  embed(_input: EmbedInput): Promise<EmbedOutput> {
    this.notConfigured();
  }

  async healthcheck(): Promise<boolean> {
    return false;
  }
}
