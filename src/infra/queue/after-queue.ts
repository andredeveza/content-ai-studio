import "server-only";
import { after } from "next/server";
import type { QueuePort } from "@/core/domain/ports/queue";
import type { PipelineWorker } from "@/core/application/services/pipeline-worker.service";
import { logger } from "@/shared/logger";

// `InlineQueueAdapter` `await`ava o pipeline inteiro dentro da própria
// server action de `/gerador` — a action (e o redirect pra Progresso)
// só retornava depois do carrossel inteiro estar pronto, então a tela
// de Progresso nunca mostrava nada além de "completed" de cara, apesar
// do `PipelineWorker` já persistir progresso incremental por step via
// `advance()` (README, checkpoint) e do Realtime do Supabase já estar
// ligado na tabela `jobs`. `after()` (Next 15, roda depois da resposta
// HTTP ser enviada, mas antes da function instance ser encerrada)
// deixa a action redirecionar assim que job+project são criados,
// enquanto o pipeline continua rodando de verdade em background — é
// isso que faz o Realtime da tela de Progresso ter algo pra mostrar.
export class AfterQueueAdapter implements QueuePort {
  constructor(private readonly worker: PipelineWorker) {}

  async enqueue(jobId: string): Promise<void> {
    after(async () => {
      const result = await this.worker.run(jobId);
      if (!result.ok) {
        logger.error("Pipeline de geração falhou", { jobId, code: result.error.code, message: result.error.message });
      }
    });
  }
}
