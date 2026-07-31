export interface PublishInput {
  readonly orgId: string;
  readonly projectId: string;
}

export interface PublishOutput {
  readonly channel: string;
  readonly status: "skipped" | "published";
  // URL do artefato publicado — só o canal `export` (bloco 9) preenche
  // isto por enquanto (URL do zip no Storage).
  readonly url?: string;
}

// `PublishingGateway` do README ("Publicação"). No MVP só o canal
// `export` é obrigatório (bloco 9: `ExportPublisher`) — até lá, ou
// quando nenhum canal está configurado, `NoopPublisher`
// (core/application/services/publisher.service.ts) só marca o step como
// concluído sem publicar nada de verdade.
export interface PublishingGateway {
  publish(input: PublishInput): Promise<PublishOutput>;
}
