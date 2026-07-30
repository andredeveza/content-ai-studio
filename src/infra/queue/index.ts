import "server-only";
import { queueConfig } from "@/config/queue";
import type { QueuePort } from "@/core/domain/ports/queue";
import type { PipelineWorker } from "@/core/application/services/pipeline-worker.service";
import { InlineQueueAdapter } from "@/infra/queue/inline-queue";

// Fábrica do adapter de fila (README: "o adapter é o mesmo" — só troca
// aqui, `GenerateCarouselUseCase` recebe um `QueuePort` e nunca sabe qual
// é). `trigger` ainda não está implementado — só `inline` roda de
// verdade no bloco 6.
export function getQueueAdapter(worker: PipelineWorker): QueuePort {
  if (queueConfig.adapter === "trigger") {
    throw new Error("Adapter de fila 'trigger' ainda não implementado — use 'inline' (config/queue.ts).");
  }
  return new InlineQueueAdapter(worker);
}
