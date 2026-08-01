export type QueueAdapter = "inline" | "after" | "trigger";

export interface QueueConfig {
  readonly adapter: QueueAdapter;
}

// README, seção "Pipeline de geração": no começo roda inline; o adapter
// trigger.dev entra no bloco 6 sem mudar os use-cases que o chamam.
// `after` (Next `after()`, ver `infra/queue/after-queue.ts`) roda o
// pipeline em background depois da resposta HTTP — troca feita para a
// tela de Progresso mostrar avanço real em vez de só "completed" já na
// primeira renderização.
export const queueConfig: QueueConfig = {
  adapter: "after",
};
