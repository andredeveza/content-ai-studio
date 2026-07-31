import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AssetEmbeddingRepository,
  EmbeddingKind,
  NearestAsset,
} from "@/core/domain/ports/asset-embedding-repository";
import type { Database, Json } from "@/infra/db/supabase/types";

export class SupabaseAssetEmbeddingRepository implements AssetEmbeddingRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async create(
    assetId: string,
    kind: EmbeddingKind,
    embedding: readonly number[],
    meta: Record<string, unknown> = {},
  ): Promise<void> {
    const { error } = await this.db.from("asset_embeddings").insert({
      asset_id: assetId,
      kind,
      embedding: [...embedding],
      meta: meta as Json,
    });

    if (error) throw error;
  }

  async findNearest(
    clientId: string,
    kind: EmbeddingKind,
    queryEmbedding: readonly number[],
    limit = 5,
  ): Promise<NearestAsset[]> {
    const { data, error } = await this.db.rpc("match_asset_embeddings", {
      p_client_id: clientId,
      p_kind: kind,
      p_query: [...queryEmbedding],
      p_match_count: limit,
    });

    if (error) throw error;
    return (data ?? []).map((row) => ({ assetId: row.asset_id, similarity: row.similarity }));
  }
}
