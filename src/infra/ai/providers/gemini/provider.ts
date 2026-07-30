import { StubProvider } from "@/infra/ai/providers/stub-provider";
import type { AIProvider } from "@/core/domain/ports/ai-provider";

export function createGeminiProvider(): AIProvider {
  return new StubProvider("gemini", ["text", "vision"]);
}
