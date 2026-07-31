import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Asset, AssetAnalysisPatch, AssetKind, NewAsset } from "@/core/domain/asset/asset";
import type { AssetRepository } from "@/core/domain/ports/asset-repository";
import type { Database } from "@/infra/db/supabase/types";

type AssetRow = Database["public"]["Tables"]["assets"]["Row"];

function toDomain(row: AssetRow): Asset {
  return {
    id: row.id,
    orgId: row.org_id,
    clientId: row.client_id,
    path: row.path,
    mime: row.mime,
    kind: row.kind,
    status: row.status,
    width: row.width,
    height: row.height,
    dominantColor: row.dominant_color,
    luminanceTop: row.luminance_top,
    luminanceMid: row.luminance_mid,
    luminanceBottom: row.luminance_bottom,
    terms: row.terms,
    excerpts: row.excerpts,
    family: row.family,
    error: row.error,
    analyzedAt: row.analyzed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseAssetRepository implements AssetRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async create(input: NewAsset): Promise<Asset> {
    const { data, error } = await this.db
      .from("assets")
      .insert({
        org_id: input.orgId,
        client_id: input.clientId,
        path: input.path,
        mime: input.mime,
        kind: input.kind,
      })
      .select("*")
      .single();

    if (error) throw error;
    return toDomain(data);
  }

  async findById(orgId: string, assetId: string): Promise<Asset | null> {
    const { data, error } = await this.db
      .from("assets")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", assetId)
      .maybeSingle();

    if (error) throw error;
    return data ? toDomain(data) : null;
  }

  async listAnalyzedImagesByClient(clientId: string): Promise<Asset[]> {
    const imageKind: AssetKind = "image";
    const { data, error } = await this.db
      .from("assets")
      .select("*")
      .eq("client_id", clientId)
      .eq("kind", imageKind)
      .eq("status", "analyzed");

    if (error) throw error;
    return (data ?? []).map(toDomain);
  }

  async markAnalyzed(assetId: string, patch: AssetAnalysisPatch): Promise<Asset | null> {
    const { data, error } = await this.db
      .from("assets")
      .update({
        status: "analyzed",
        analyzed_at: new Date().toISOString(),
        error: null,
        ...(patch.width !== undefined && { width: patch.width }),
        ...(patch.height !== undefined && { height: patch.height }),
        ...(patch.dominantColor !== undefined && { dominant_color: patch.dominantColor }),
        ...(patch.luminanceTop !== undefined && { luminance_top: patch.luminanceTop }),
        ...(patch.luminanceMid !== undefined && { luminance_mid: patch.luminanceMid }),
        ...(patch.luminanceBottom !== undefined && { luminance_bottom: patch.luminanceBottom }),
        ...(patch.terms !== undefined && { terms: [...patch.terms] }),
        ...(patch.excerpts !== undefined && { excerpts: [...patch.excerpts] }),
        ...(patch.family !== undefined && { family: patch.family }),
      })
      .eq("id", assetId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? toDomain(data) : null;
  }

  async markFailed(assetId: string, error: string): Promise<Asset | null> {
    const { data, error: dbError } = await this.db
      .from("assets")
      .update({ status: "failed", error })
      .eq("id", assetId)
      .select("*")
      .maybeSingle();

    if (dbError) throw dbError;
    return data ? toDomain(data) : null;
  }
}
