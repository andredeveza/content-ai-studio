import "server-only";
import { createAdminClient } from "@/infra/db/supabase/admin";
import { SupabaseProjectRepository } from "@/infra/db/supabase/repositories/project-repository";
import { SupabaseJobRepository } from "@/infra/db/supabase/repositories/job-repository";
import { SupabaseSlideRepository } from "@/infra/db/supabase/repositories/slide-repository";
import { SupabaseClientRepository } from "@/infra/db/supabase/repositories/client-repository";
import { SupabaseBrandKitRepository } from "@/infra/db/supabase/repositories/brand-kit-repository";
import { SupabaseAssetRepository } from "@/infra/db/supabase/repositories/asset-repository";
import { SupabaseMediaRepository } from "@/infra/db/supabase/repositories/media-repository";
import { SupabaseStorage } from "@/infra/storage/supabase-storage";
import { getAIGateway } from "@/infra/ai/bootstrap";
import { getRenderSlidePort } from "@/infra/render/bootstrap";
import { getQueueAdapter } from "@/infra/queue";
import { ResearchService } from "@/core/application/services/research.service";
import { CopyService } from "@/core/application/services/copy.service";
import { PromptService } from "@/core/application/services/prompt.service";
import { ImageService } from "@/core/application/services/image.service";
import { RetrieveAssetsService } from "@/core/application/services/retrieve-assets.service";
import { PipelineWorker } from "@/core/application/services/pipeline-worker.service";
import { ExportPublisher } from "@/core/application/services/publisher.service";
import { ExportProjectUseCase } from "@/core/application/use-cases/export-project";
import { RerenderSlideUseCase } from "@/core/application/use-cases/rerender-slide";
import { GenerateCarouselUseCase } from "@/core/application/use-cases/generate-carousel";
import { ListProjectsUseCase } from "@/core/application/use-cases/list-projects";

// Composition root do Gerador (bloco 6 + pendências pós-MVP): monta o
// mesmo PipelineWorker de sempre, só que com as implementações de
// produção de cada dependência (README, "Pipeline de geração") — nenhum
// bootstrap prévio existia porque nenhuma tela chamava
// GenerateCarouselUseCase ainda. service_role em tudo, mesmo raciocínio
// de infra/editor/bootstrap.ts: autorização é feita nos use-cases via
// org_id, não por RLS.
export function getGenerateCarouselUseCase(): GenerateCarouselUseCase {
  const db = createAdminClient();

  const projects = new SupabaseProjectRepository(db);
  const jobs = new SupabaseJobRepository(db);
  const slides = new SupabaseSlideRepository(db);
  const clients = new SupabaseClientRepository(db);
  const brandKits = new SupabaseBrandKitRepository(db);
  const assets = new SupabaseAssetRepository(db);
  const media = new SupabaseMediaRepository(db);
  const mediaStorage = new SupabaseStorage(db, "media");
  const exportStorage = new SupabaseStorage(db, "exports");

  const gateway = getAIGateway();
  const renderSlide = getRenderSlidePort();
  const rerenderSlide = new RerenderSlideUseCase(slides, projects, brandKits, renderSlide);
  const exportProject = new ExportProjectUseCase(projects, slides, media, mediaStorage, exportStorage, rerenderSlide);

  const worker = new PipelineWorker({
    jobs,
    projects,
    slides,
    clients,
    brandKits,
    assets,
    research: new ResearchService(gateway),
    copy: new CopyService(gateway),
    prompt: new PromptService(),
    image: new ImageService(gateway, new RetrieveAssetsService(assets, mediaStorage)),
    renderSlide,
    publisher: new ExportPublisher(exportProject),
  });

  return new GenerateCarouselUseCase(projects, jobs, getQueueAdapter(worker));
}

export function getListProjectsUseCase(): ListProjectsUseCase {
  return new ListProjectsUseCase(new SupabaseProjectRepository(createAdminClient()));
}

export function getJobRepository(): SupabaseJobRepository {
  return new SupabaseJobRepository(createAdminClient());
}
