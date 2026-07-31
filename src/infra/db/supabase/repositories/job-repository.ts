import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Job, JobCheckpoint, JobPatch, NewJob } from "@/core/domain/pipeline/job";
import type { JobRepository } from "@/core/domain/ports/job-repository";
import type { Database, Json } from "@/infra/db/supabase/types";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];

function toDomain(row: JobRow): Job {
  return {
    id: row.id,
    orgId: row.org_id,
    projectId: row.project_id,
    step: row.step,
    progress: row.progress,
    attempts: row.attempts,
    payload: row.payload as unknown as JobCheckpoint,
    state: row.state,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseJobRepository implements JobRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async create(input: NewJob): Promise<Job> {
    // `step` não tem default na tabela (só state/progress/attempts/payload
    // têm) — sem setar aqui, o insert falha com "null value in column
    // step" (só descoberto ao rodar o pipeline de verdade pela primeira
    // vez; os fakes de teste sempre setaram "research" manualmente).
    const { data, error } = await this.db
      .from("jobs")
      .insert({ org_id: input.orgId, project_id: input.projectId, step: "research" })
      .select("*")
      .single();

    if (error) throw error;
    return toDomain(data);
  }

  async findById(jobId: string): Promise<Job | null> {
    const { data, error } = await this.db.from("jobs").select("*").eq("id", jobId).maybeSingle();
    if (error) throw error;
    return data ? toDomain(data) : null;
  }

  async update(jobId: string, patch: JobPatch): Promise<Job | null> {
    const { data, error } = await this.db
      .from("jobs")
      .update({
        ...(patch.step !== undefined && { step: patch.step }),
        ...(patch.progress !== undefined && { progress: patch.progress }),
        ...(patch.attempts !== undefined && { attempts: patch.attempts }),
        ...(patch.payload !== undefined && { payload: patch.payload as unknown as Json }),
        ...(patch.state !== undefined && { state: patch.state }),
        ...(patch.error !== undefined && { error: patch.error }),
      })
      .eq("id", jobId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? toDomain(data) : null;
  }
}
