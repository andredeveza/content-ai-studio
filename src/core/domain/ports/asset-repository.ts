import type { Asset, AssetAnalysisPatch, NewAsset } from "@/core/domain/asset/asset";

export interface AssetRepository {
  create(input: NewAsset): Promise<Asset>;
  findById(orgId: string, assetId: string): Promise<Asset | null>;
  // Candidatos a foto de slide (README, "Recuperação"): só imagens já
  // analisadas entram na pontuação.
  listAnalyzedImagesByClient(clientId: string): Promise<Asset[]>;
  markAnalyzed(assetId: string, patch: AssetAnalysisPatch): Promise<Asset | null>;
  markFailed(assetId: string, error: string): Promise<Asset | null>;
}
