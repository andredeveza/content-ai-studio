import "server-only";
import { randomUUID } from "node:crypto";
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
import type { StoragePort } from "@/core/domain/ports/storage";
import { ExternalServiceError } from "@/shared/errors";

const ROUTER_URL = "https://router.huggingface.co/hf-inference/models";

// Confirmado rodando de verdade em 2026-07-30: FLUX.1-schnell saiu do
// provider hf-inference (410 Gone — "deprecated and no longer
// supported"). stable-diffusion-3-medium é o que está disponível
// gratuitamente no provider hf-inference hoje. Se a Hugging Face trocar
// de novo, reveja com
// `curl https://huggingface.co/api/models?pipeline_tag=text-to-image&inference_provider=hf-inference`.
const DEFAULT_IMAGE_MODEL = "stabilityai/stable-diffusion-3-medium-diffusers";

interface HuggingFaceProviderOptions {
  readonly apiKey: string;
  // Onde a imagem gerada é persistida — a Inference API devolve os
  // bytes direto, não uma URL, e ImageOutput.imageUrl precisa de uma
  // URL (o Puppeteer busca por HTTP na hora do render, bloco 4/5).
  readonly storage: StoragePort;
  readonly imageModel?: string;
}

function unsupported(capability: string): never {
  throw new ExternalServiceError(`HuggingFaceProvider não implementa "${capability}" ainda.`, "huggingface");
}

// README, "AI Gateway": Hugging Face cobre image/embed. Bloco de
// completar as pendências: só a geração de imagem foi implementada de
// verdade por enquanto — embed (RAG, bloco 7) continua pendente.
export class HuggingFaceProvider implements AIProvider {
  readonly id = "huggingface";
  readonly capabilities: readonly Capability[] = ["image"];

  constructor(private readonly options: HuggingFaceProviderOptions) {}

  async generateText(_input: TextInput): Promise<TextOutput> {
    return unsupported("generateText");
  }

  async analyzeImage(_input: VisionInput): Promise<VisionOutput> {
    return unsupported("analyzeImage");
  }

  async embed(_input: EmbedInput): Promise<EmbedOutput> {
    return unsupported("embed");
  }

  async generateImage(input: ImageInput): Promise<ImageOutput> {
    const model = this.options.imageModel ?? DEFAULT_IMAGE_MODEL;

    let response: Response;
    try {
      response = await fetch(`${ROUTER_URL}/${model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: input.prompt }),
      });
    } catch (cause) {
      throw new ExternalServiceError("Falha ao chamar a Hugging Face Inference API.", "huggingface", cause);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new ExternalServiceError(
        `Hugging Face respondeu ${response.status} para o modelo "${model}": ${detail}`,
        "huggingface",
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      const detail = await response.text().catch(() => "");
      throw new ExternalServiceError(`Hugging Face não retornou uma imagem: ${detail}`, "huggingface");
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    const extension = contentType.includes("png") ? "png" : "jpg";
    const path = `ai-generated/${randomUUID()}.${extension}`;

    const uploaded = await this.options.storage.upload({ path, file: bytes, contentType });

    return { imageUrl: uploaded.publicUrl, model };
  }

  async healthcheck(): Promise<boolean> {
    // Não gera uma imagem de verdade só pra checar saúde (custaria
    // tempo/cota) — só confirma que a chave existe.
    return Boolean(this.options.apiKey);
  }
}

export function createHuggingFaceProvider(options: HuggingFaceProviderOptions): AIProvider {
  return new HuggingFaceProvider(options);
}
