import type { Project } from "@/core/domain/project/project";
import type { ProjectRepository } from "@/core/domain/ports/project-repository";

export class ListProjectsUseCase {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(orgId: string): Promise<Project[]> {
    return this.projects.listByOrg(orgId);
  }
}
