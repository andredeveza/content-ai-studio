// Adapter da fila (README, "Pipeline de geração": "no começo pode rodar
// inline; o adapter é o mesmo"). `InlineQueueAdapter` (bloco 6) executa o
// pipeline na hora, aguardando; um adapter trigger.dev futuro enfileira
// e retoma depois — GenerateCarouselUseCase não muda em nenhum dos dois
// casos, só troca qual QueuePort é injetado.
export interface QueuePort {
  enqueue(jobId: string): Promise<void>;
}
