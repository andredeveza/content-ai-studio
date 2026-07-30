export type QueueAdapter = "inline" | "trigger";

export interface QueueConfig {
  readonly adapter: QueueAdapter;
}

// README, seção "Pipeline de geração": no começo roda inline; o adapter
// trigger.dev entra no bloco 6 sem mudar os use-cases que o chamam.
export const queueConfig: QueueConfig = {
  adapter: "inline",
};
