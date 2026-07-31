export type EmbeddingKind = "visual" | "semantic";

export interface NearestAsset {
  readonly assetId: string;
  readonly similarity: number;
}

// README, "Indexação"/"Recuperação". Populado só quando um provedor de
// embedding real estiver ligado (Hugging Face é feature-flag desligada
// por padrão — README, "AI Gateway": "No MVP só OpenRouter é
// obrigatório").
export interface AssetEmbeddingRepository {
  create(assetId: string, kind: EmbeddingKind, embedding: readonly number[], meta?: Record<string, unknown>): Promise<void>;
  findNearest(clientId: string, kind: EmbeddingKind, queryEmbedding: readonly number[], limit?: number): Promise<NearestAsset[]>;
}
