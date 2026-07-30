import type { PublishInput, PublishingGateway, PublishOutput } from "@/core/domain/ports/publisher";

// Step "publish" (95%). O canal `export` (README, "Publicação": "No MVP
// só o canal export") só chega no bloco 9 — até lá, o pipeline usa este
// no-op pra manter os 7 steps completos sem publicar nada de verdade.
export class NoopPublisher implements PublishingGateway {
  async publish(_input: PublishInput): Promise<PublishOutput> {
    return { channel: "none", status: "skipped" };
  }
}
