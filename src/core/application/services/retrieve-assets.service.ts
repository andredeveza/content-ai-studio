import { RETRIEVAL_SCORE_THRESHOLD, scoreAsset, topicFitFromTags } from "@/core/application/services/asset-scoring.service";
import type { Asset } from "@/core/domain/asset/asset";
import type { AssetRepository } from "@/core/domain/ports/asset-repository";
import type { AssetMatch, AssetQuery, RetrievalPort } from "@/core/domain/ports/retrieval";
import type { StoragePort } from "@/core/domain/ports/storage";

// Implementação de produção de RetrievalPort (README, "Acervo / RAG" >
// "Recuperação"). Pontua cada imagem já analisada do cliente e devolve a
// melhor — se nenhuma passar do limite, `null` (o ImageService, bloco 6,
// cai no fallback de gerar com IA).
export class RetrieveAssetsService implements RetrievalPort {
  constructor(
    private readonly assets: AssetRepository,
    private readonly storage: StoragePort,
  ) {}

  async findBestAsset(query: AssetQuery): Promise<AssetMatch | null> {
    const candidates = await this.assets.listAnalyzedImagesByClient(query.clientId);
    if (candidates.length === 0) return null;

    let best: { asset: Asset; total: number; illegible: boolean } | null = null;

    for (const asset of candidates) {
      const luminanceAtBand = query.titleBand === "top" ? asset.luminanceTop : asset.luminanceBottom;
      if (asset.width == null || asset.height == null || luminanceAtBand == null) continue;

      // topicFit "de produção" seria embedding visual (README) — como
      // nenhum provider de embedding real está ligado no MVP, usa
      // sempre o fallback literal do protótipo (tags do nome do
      // arquivo).
      const topicFit = topicFitFromTags(query.theme, asset.terms);
      const { total, illegible } = scoreAsset({
        aspect: asset.width / asset.height,
        luminanceAtBand,
        topicFit,
        alreadyUsed: query.usedAssetIds.includes(asset.id),
      });

      if (!best || total > best.total) best = { asset, total, illegible: illegible > 0 };
    }

    // Devolve o melhor candidato SEM aplicar o corte: o limite é decisão
    // do ImageService, que tem contexto do carrossel inteiro (o passe de
    // garantia usa um piso mais baixo quando nenhum asset entrou ainda).
    if (!best) return null;

    const luminanceAtBand =
      (query.titleBand === "top" ? best.asset.luminanceTop : best.asset.luminanceBottom) ?? 0;

    return {
      assetId: best.asset.id,
      url: this.storage.getPublicUrl(best.asset.path),
      score: best.total,
      luminanceAtBand,
      illegible: best.illegible,
    };
  }
}
