import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArchetypeId } from "@/core/domain/template/blueprint";
import type { SlideRole } from "@/core/domain/template/slide-role";
import type { LayoutVariant } from "@/core/domain/template/variant";
import type { NewSlide, Slide, SlideOverrides } from "@/core/domain/project/slide";
import type { SlideContent } from "@/core/domain/template/slide-content";
import type { SlideRepository } from "@/core/domain/ports/slide-repository";
import type { Database, Json } from "@/infra/db/supabase/types";

type SlideRow = Database["public"]["Tables"]["slides"]["Row"];

function toDomain(row: SlideRow): Slide {
  return {
    id: row.id,
    projectId: row.project_id,
    index: row.index,
    archetypeId: row.archetype_id as ArchetypeId,
    role: (row.role as SlideRole | null) ?? null,
    variant: (row.variant as unknown as LayoutVariant | null) ?? null,
    content: row.content as unknown as SlideContent,
    overrides: row.overrides as unknown as SlideOverrides | null,
    mediaId: row.media_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseSlideRepository implements SlideRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async upsertMany(projectId: string, slides: readonly NewSlide[]): Promise<Slide[]> {
    const { data, error } = await this.db
      .from("slides")
      .upsert(
        slides.map((slide) => ({
          project_id: projectId,
          index: slide.index,
          archetype_id: slide.archetypeId,
          role: slide.role ?? null,
          variant: (slide.variant ?? null) as unknown as Json,
          content: slide.content as unknown as Json,
        })),
        { onConflict: "project_id,index" },
      )
      .select("*");

    if (error) throw error;
    return (data ?? []).map(toDomain);
  }

  async listByProject(projectId: string): Promise<Slide[]> {
    const { data, error } = await this.db
      .from("slides")
      .select("*")
      .eq("project_id", projectId)
      .order("index", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(toDomain);
  }

  async findById(slideId: string): Promise<Slide | null> {
    const { data, error } = await this.db.from("slides").select("*").eq("id", slideId).maybeSingle();
    if (error) throw error;
    return data ? toDomain(data) : null;
  }

  async updateContent(slideId: string, content: SlideContent): Promise<Slide | null> {
    const { data, error } = await this.db
      .from("slides")
      .update({ content: content as unknown as Json })
      .eq("id", slideId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? toDomain(data) : null;
  }

  async setMediaId(slideId: string, mediaId: string): Promise<Slide | null> {
    const { data, error } = await this.db
      .from("slides")
      .update({ media_id: mediaId })
      .eq("id", slideId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? toDomain(data) : null;
  }

  async updateOverrides(slideId: string, overrides: SlideOverrides | null): Promise<Slide | null> {
    const { data, error } = await this.db
      .from("slides")
      .update({ overrides: overrides as unknown as Json | null })
      .eq("id", slideId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? toDomain(data) : null;
  }
}
