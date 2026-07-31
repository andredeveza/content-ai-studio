import { describe, expect, it } from "vitest";
import { ExportPublisher, NoopPublisher } from "@/core/application/services/publisher.service";
import type { ExportProjectUseCase, ExportedProject } from "@/core/application/use-cases/export-project";
import { ExternalServiceError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

describe("NoopPublisher (bloco 6)", () => {
  it("sempre retorna status skipped", async () => {
    const result = await new NoopPublisher().publish({ orgId: "org-1", projectId: "project-1" });
    expect(result).toEqual({ channel: "none", status: "skipped" });
  });
});

describe("ExportPublisher (bloco 9)", () => {
  it("delega pro ExportProjectUseCase e devolve a url do zip", async () => {
    const fakeExportProject = {
      execute: async (): Promise<Result<ExportedProject, AppError>> =>
        ok({ path: "org-1/project-1/carrossel.zip", publicUrl: "https://storage.local/exports/carrossel.zip" }),
    } as unknown as ExportProjectUseCase;

    const publisher = new ExportPublisher(fakeExportProject);
    const result = await publisher.publish({ orgId: "org-1", projectId: "project-1" });

    expect(result).toEqual({
      channel: "export",
      status: "published",
      url: "https://storage.local/exports/carrossel.zip",
    });
  });

  it("lança o erro do use-case quando a exportação falha", async () => {
    const fakeExportProject = {
      execute: async (): Promise<Result<ExportedProject, AppError>> =>
        err(new ExternalServiceError("bucket indisponível", "supabase-storage")),
    } as unknown as ExportProjectUseCase;

    const publisher = new ExportPublisher(fakeExportProject);
    await expect(publisher.publish({ orgId: "org-1", projectId: "project-1" })).rejects.toThrow(
      "bucket indisponível",
    );
  });
});
