import type { ExportProjectUseCase } from "@/core/application/use-cases/export-project";
import type { PublishInput, PublishingGateway, PublishOutput } from "@/core/domain/ports/publisher";

// Step "publish" (95%) quando nenhum canal real está configurado — não
// publica nada, só mantém os 7 steps completos.
export class NoopPublisher implements PublishingGateway {
  async publish(_input: PublishInput): Promise<PublishOutput> {
    return { channel: "none", status: "skipped" };
  }
}

// Canal `export` (README, "Publicação": "No MVP só o canal export"),
// bloco 9. Roda como step "publish" do pipeline (95%) — se falhar, o
// erro sobe igual a qualquer outro step (o zip faz parte do "critério de
// pronto", não é opcional).
export class ExportPublisher implements PublishingGateway {
  constructor(private readonly exportProject: ExportProjectUseCase) {}

  async publish(input: PublishInput): Promise<PublishOutput> {
    const result = await this.exportProject.execute(input.orgId, input.projectId);
    if (!result.ok) throw result.error;

    return { channel: "export", status: "published", url: result.value.publicUrl };
  }
}
