export interface PublishInput {
  readonly projectId: string;
}

export interface PublishOutput {
  readonly channel: string;
  readonly status: "skipped" | "published";
}

// `PublishingGateway` do README ("Publicação"). No MVP só o canal
// `export` é obrigatório, e ele chega no bloco 9 — até lá, o pipeline usa
// um `NoopPublisher` (core/application/services/publisher.service.ts)
// que só marca o step como concluído sem publicar nada de verdade.
export interface PublishingGateway {
  publish(input: PublishInput): Promise<PublishOutput>;
}
