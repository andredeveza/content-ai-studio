// Qual faixa de luminância importa depende de onde o texto ancora no
// blueprint escolhido (bloco 4): "foto-total" ancora a manchete na base
// (precisa de base escura), um blueprint hipotético com texto no topo
// precisaria do topo escuro. Espelha `needsDarkTop`/`needsDarkBottom` do
// protótipo (design/Acervo Inteligente.dc.html).
export type TitleBand = "top" | "bottom";

export interface AssetQuery {
  readonly clientId: string;
  readonly theme: string;
  readonly titleBand: TitleBand;
  // IDs já usados neste carrossel — vira `penalty` (README: 0.12).
  readonly usedAssetIds: readonly string[];
}

export interface AssetMatch {
  readonly assetId: string;
  readonly url: string;
  readonly score: number;
  // Luminância da faixa relevante (`titleBand`) do asset escolhido — usa
  // para calcular o véu (scrim) no render, que é sempre calculado, nunca
  // fixo (README).
  readonly luminanceAtBand: number;
}

// `RetrievalService` do README ("Acervo / RAG"). O algoritmo de score
// real (ratioFit/contrastFit/topicFit/penalty/illegible) chega no bloco
// 7 — `RetrieveAssetsService` implementa isto de verdade;
// `NoopRetrievalService` (bloco 6) continua existindo pra quem ainda não
// tem acervo nenhum.
export interface RetrievalPort {
  findBestAsset(query: AssetQuery): Promise<AssetMatch | null>;
}
