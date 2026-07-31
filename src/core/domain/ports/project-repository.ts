import type { NewProject, Project, ProjectPatch } from "@/core/domain/project/project";

export interface ProjectRepository {
  create(input: NewProject): Promise<Project>;
  findById(orgId: string, projectId: string): Promise<Project | null>;
  update(orgId: string, projectId: string, patch: ProjectPatch): Promise<Project | null>;
  listByOrg(orgId: string): Promise<Project[]>;
}
