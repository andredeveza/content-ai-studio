import { StubProvider } from "@/infra/ai/providers/stub-provider";
import type { AIProvider } from "@/core/domain/ports/ai-provider";

export function createFalProvider(): AIProvider {
  return new StubProvider("fal", ["image"]);
}
