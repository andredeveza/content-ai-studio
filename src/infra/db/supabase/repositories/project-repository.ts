import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewProject, Project, ProjectPatch } from "@/core/domain/project/project";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";
import type { Database } from "@/infra/db/supabase/types";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

function toDomain(row: ProjectRow): Project {
  return {
    id: row.id,
    orgId: row.org_id,
    clientId: row.client_id,
    theme: row.theme,
    goal: row.goal,
    status: row.status,
    progress: row.progress,
    slideCount: row.slide_count,
    ratio: row.ratio,
    caption: row.caption,
    hashtags: row.hashtags,
    cta: row.cta,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseProjectRepository implements ProjectRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async create(input: NewProject): Promise<Project> {
    const { data, error } = await this.db
      .from("projects")
      .insert({
        org_id: input.orgId,
        client_id: input.clientId,
        theme: input.theme,
        goal: input.goal,
        slide_count: input.slideCount,
        ratio: input.ratio ?? "4:5",
      })
      .select("*")
      .single();

    if (error) throw error;
    return toDomain(data);
  }

  async findById(orgId: string, projectId: string): Promise<Project | null> {
    const { data, error } = await this.db
      .from("projects")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", projectId)
      .maybeSingle();

    if (error) throw error;
    return data ? toDomain(data) : null;
  }

  async update(orgId: string, projectId: string, patch: ProjectPatch): Promise<Project | null> {
    const { data, error } = await this.db
      .from("projects")
      .update({
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.progress !== undefined && { progress: patch.progress }),
        ...(patch.caption !== undefined && { caption: patch.caption }),
        ...(patch.hashtags !== undefined && { hashtags: [...patch.hashtags] }),
        ...(patch.cta !== undefined && { cta: patch.cta }),
      })
      .eq("org_id", orgId)
      .eq("id", projectId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? toDomain(data) : null;
  }

  async listByOrg(orgId: string): Promise<Project[]> {
    const { data, error } = await this.db
      .from("projects")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(toDomain);
  }
}
