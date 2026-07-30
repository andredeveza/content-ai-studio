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

const BASE_URL = "https://openrouter.ai/api/v1";

interface OpenRouterProviderOptions {
  readonly apiKey: string;
  readonly model: string;
  readonly timeoutMs?: number;
}

interface OpenRouterChatResponse {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  model?: string;
}

// Único provider obrigatório no MVP (README, seção "AI Gateway"). Só
// implementa `generateText` — as demais capabilities não são cobertas por
// este provider e disparam ExternalServiceError se chamadas, o que nunca
// deve acontecer: o registry só o inclui na ordem de fallback de "text".
export class OpenRouterProvider implements AIProvider {
  readonly id = "openrouter";
  readonly capabilities: readonly Capability[] = ["text"];

  constructor(private readonly options: OpenRouterProviderOptions) {}

  async generateText(input: TextInput): Promise<TextOutput> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 30_000);

    let response: Response;
    try {
      response = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.options.model,
          messages: [
            ...(input.system ? [{ role: "system", content: input.system }] : []),
            { role: "user", content: input.prompt },
          ],
          max_tokens: input.maxTokens,
          temperature: input.temperature,
        }),
        signal: controller.signal,
      });
    } catch (cause) {
      throw new ExternalServiceError("Timeout ou falha de rede ao chamar OpenRouter.", "openrouter", cause);
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 429) {
      throw new ExternalServiceError("Quota do OpenRouter excedida.", "openrouter");
    }
    if (response.status >= 500) {
      throw new ExternalServiceError(`OpenRouter respondeu ${response.status}.`, "openrouter");
    }
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new ExternalServiceError(`OpenRouter respondeu ${response.status}: ${body}`, "openrouter");
    }

    const data = (await response.json()) as OpenRouterChatResponse;
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new ExternalServiceError("OpenRouter retornou resposta vazia.", "openrouter");
    }

    return {
      text,
      model: data.model ?? this.options.model,
      tokensInput: data.usage?.prompt_tokens ?? 0,
      tokensOutput: data.usage?.completion_tokens ?? 0,
    };
  }

  generateImage(_input: ImageInput): Promise<ImageOutput> {
    throw new ExternalServiceError("OpenRouterProvider não implementa generateImage.", "openrouter");
  }

  analyzeImage(_input: VisionInput): Promise<VisionOutput> {
    throw new ExternalServiceError("OpenRouterProvider não implementa analyzeImage.", "openrouter");
  }

  embed(_input: EmbedInput): Promise<EmbedOutput> {
    throw new ExternalServiceError("OpenRouterProvider não implementa embed.", "openrouter");
  }

  async healthcheck(): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/models`, {
        headers: { Authorization: `Bearer ${this.options.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
