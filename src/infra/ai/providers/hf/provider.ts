import { StubProvider } from "@/infra/ai/providers/stub-provider";
import type { AIProvider } from "@/core/domain/ports/ai-provider";

export function createHuggingFaceProvider(): AIProvider {
  return new StubProvider("huggingface", ["image", "embed"]);
}
