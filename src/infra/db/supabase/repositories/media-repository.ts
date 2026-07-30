import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Media, NewMedia } from "@/core/domain/media/media";
import type { MediaRepository } from "@/core/domain/ports/media-repository";
import type { Database } from "@/infra/db/supabase/types";

type MediaRow = Database["public"]["Tables"]["media"]["Row"];

function toDomain(row: MediaRow): Media {
  return {
    id: row.id,
    orgId: row.org_id,
    path: row.path,
    kind: row.kind,
    width: row.width,
    height: row.height,
    provider: row.provider,
    promptId: row.prompt_id,
    createdAt: row.created_at,
  };
}

export class SupabaseMediaRepository implements MediaRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async create(input: NewMedia): Promise<Media> {
    const { data, error } = await this.db
      .from("media")
      .insert({
        org_id: input.orgId,
        path: input.path,
        kind: input.kind,
        width: input.width,
        height: input.height,
        provider: input.provider ?? null,
        prompt_id: input.promptId ?? null,
      })
      .select("*")
      .single();

    if (error) throw error;
    return toDomain(data);
  }

  async findById(orgId: string, mediaId: string): Promise<Media | null> {
    const { data, error } = await this.db
      .from("media")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", mediaId)
      .maybeSingle();

    if (error) throw error;
    return data ? toDomain(data) : null;
  }
}
