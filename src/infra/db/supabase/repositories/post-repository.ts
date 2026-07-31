import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalendarPost, NewPost, Post, PostStatus } from "@/core/domain/post/post";
import type { PostRepository } from "@/core/domain/ports/post-repository";
import type { Database } from "@/infra/db/supabase/types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

// Formato da linha com o join embutido (projects → clients) usado só em
// listForCalendar — não corresponde a nenhuma tabela isolada, por isso
// não está em `Database`.
interface CalendarPostRow {
  id: string;
  project_id: string;
  scheduled_at: string;
  status: PostStatus;
  projects: { theme: string; clients: { handles: string[] } | null } | null;
}

function toDomain(row: PostRow): Post {
  return {
    id: row.id,
    orgId: row.org_id,
    projectId: row.project_id,
    scheduledAt: row.scheduled_at,
    status: row.status,
    channelTargets: row.channel_targets,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabasePostRepository implements PostRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async upsertSchedule(input: NewPost): Promise<Post> {
    const { data, error } = await this.db
      .from("posts")
      .upsert(
        {
          org_id: input.orgId,
          project_id: input.projectId,
          scheduled_at: input.scheduledAt,
          channel_targets: input.channelTargets ? [...input.channelTargets] : undefined,
          status: "scheduled",
        },
        { onConflict: "project_id" },
      )
      .select("*")
      .single();

    if (error) throw error;
    return toDomain(data);
  }

  async findByProjectId(orgId: string, projectId: string): Promise<Post | null> {
    const { data, error } = await this.db
      .from("posts")
      .select("*")
      .eq("org_id", orgId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (error) throw error;
    return data ? toDomain(data) : null;
  }

  async updateStatus(orgId: string, postId: string, status: PostStatus): Promise<Post | null> {
    const { data, error } = await this.db
      .from("posts")
      .update({ status })
      .eq("org_id", orgId)
      .eq("id", postId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? toDomain(data) : null;
  }

  async delete(orgId: string, postId: string): Promise<boolean> {
    const { data, error } = await this.db
      .from("posts")
      .delete()
      .eq("org_id", orgId)
      .eq("id", postId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }

  async listForCalendar(orgId: string, monthStart: string, monthEnd: string): Promise<CalendarPost[]> {
    const { data, error } = await this.db
      .from("posts")
      .select("id, project_id, scheduled_at, status, projects(theme, clients(handles))")
      .eq("org_id", orgId)
      .gte("scheduled_at", monthStart)
      .lt("scheduled_at", monthEnd)
      .order("scheduled_at", { ascending: true });

    if (error) throw error;

    const rows = (data ?? []) as unknown as CalendarPostRow[];
    return rows.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      scheduledAt: row.scheduled_at,
      status: row.status,
      theme: row.projects?.theme ?? "(projeto removido)",
      handle: row.projects?.clients?.handles?.[0] ?? null,
    }));
  }
}
