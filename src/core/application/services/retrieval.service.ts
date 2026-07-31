import type { AssetMatch, RetrievalPort } from "@/core/domain/ports/retrieval";

// Fallback para quando não há AssetRepository disponível (ou o acervo
// do cliente está vazio). O algoritmo de score real
// (RetrieveAssetsService, bloco 7) é a implementação de produção — esta
// classe sempre retorna "nenhum asset passou do limite", e o
// ImageService cai no fallback de gerar com IA.
export class NoopRetrievalService implements RetrievalPort {
  async findBestAsset(): Promise<AssetMatch | null> {
    return null;
  }
}
