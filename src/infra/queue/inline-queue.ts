import "server-only";
import type { QueuePort } from "@/core/domain/ports/queue";
import type { PipelineWorker } from "@/core/application/services/pipeline-worker.service";
import { logger } from "@/shared/logger";

// Único adapter real do bloco 6 (README: "no começo pode rodar inline").
// `enqueue` aguarda o pipeline inteiro rodar — quem chama
// GenerateCarouselUseCase já recebeu o `project`/`jobId` antes disso
// terminar, então o erro aqui só é logado; o estado final mora em
// `jobs.state`/`jobs.error`, que é o que o cliente acompanha por
// Realtime.
export class InlineQueueAdapter implements QueuePort {
  constructor(private readonly worker: PipelineWorker) {}

  async enqueue(jobId: string): Promise<void> {
    const result = await this.worker.run(jobId);
    if (!result.ok) {
      logger.error("Pipeline de geração falhou", { jobId, code: result.error.code, message: result.error.message });
    }
  }
}
