export interface AssetMatch {
  readonly url: string;
  readonly score: number;
}

// `RetrievalService` do README ("Acervo / RAG"). O algoritmo de score
// real (ratioFit/contrastFit/topicFit/penalty/illegible) só chega no
// bloco 7 — até lá, `NoopRetrievalService` sempre retorna `null` e o
// ImageService cai no fallback de gerar com IA.
export interface RetrievalPort {
  findBestAsset(clientId: string, brief: string): Promise<AssetMatch | null>;
}
