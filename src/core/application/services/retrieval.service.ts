import type { AssetMatch, RetrievalPort } from "@/core/domain/ports/retrieval";

// Placeholder até o bloco 7 (Acervo/RAG) portar o algoritmo de score real
// do protótipo. Sempre "nenhum asset do acervo passou do limite" — o
// ImageService cai no fallback de gerar com IA para todo slide com slot
// de mídia, exatamente como acontece quando o acervo do cliente está
// vazio em produção.
export class NoopRetrievalService implements RetrievalPort {
  async findBestAsset(): Promise<AssetMatch | null> {
    return null;
  }
}
