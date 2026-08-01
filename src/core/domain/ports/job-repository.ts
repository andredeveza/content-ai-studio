import type { Job, JobPatch, NewJob } from "@/core/domain/pipeline/job";

export interface JobRepository {
  create(input: NewJob): Promise<Job>;
  findById(jobId: string): Promise<Job | null>;
  // Aba "geração" do protótipo (tab bar de 5 itens): leva o usuário para
  // o job mais recente da org, que é o que ele estava acompanhando.
  findLatestByOrg(orgId: string): Promise<Job | null>;
  update(jobId: string, patch: JobPatch): Promise<Job | null>;
}
