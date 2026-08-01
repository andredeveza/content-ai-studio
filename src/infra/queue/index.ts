import "server-only";
import { queueConfig } from "@/config/queue";
import type { QueuePort } from "@/core/domain/ports/queue";
import type { PipelineWorker } from "@/core/application/services/pipeline-worker.service";
import { InlineQueueAdapter } from "@/infra/queue/inline-queue";
import { AfterQueueAdapter } from "@/infra/queue/after-queue";

// Fábrica do adapter de fila (README: "o adapter é o mesmo" — só troca
// aqui, `GenerateCarouselUseCase` recebe um `QueuePort` e nunca sabe qual
// é). `trigger` ainda não está implementado.
export function getQueueAdapter(worker: PipelineWorker): QueuePort {
  switch (queueConfig.adapter) {
    case "inline":
      return new InlineQueueAdapter(worker);
    case "after":
      return new AfterQueueAdapter(worker);
    case "trigger":
      throw new Error("Adapter de fila 'trigger' ainda não implementado — use 'inline' ou 'after' (config/queue.ts).");
  }
}
