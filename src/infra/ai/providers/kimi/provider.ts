import { StubProvider } from "@/infra/ai/providers/stub-provider";
import type { AIProvider } from "@/core/domain/ports/ai-provider";

export function createKimiProvider(): AIProvider {
  return new StubProvider("kimi", ["text"]);
}
