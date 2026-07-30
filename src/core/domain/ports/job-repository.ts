import type { Job, JobPatch, NewJob } from "@/core/domain/pipeline/job";

export interface JobRepository {
  create(input: NewJob): Promise<Job>;
  findById(jobId: string): Promise<Job | null>;
  update(jobId: string, patch: JobPatch): Promise<Job | null>;
}
