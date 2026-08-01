"use server";

import type { EditorSlideData } from "@/components/editor/editor-screen";
import { getEditorRepositories } from "@/infra/editor/bootstrap";
import { getAIGateway } from "@/infra/ai/bootstrap";
import { getCurrentSession } from "@/lib/session";
import { PromptService } from "@/core/application/services/prompt.service";
import { ExportProjectUseCase } from "@/core/application/use-cases/export-project";
import { RegenerateSlideMediaUseCase } from "@/core/application/use-cases/regenerate-slide-media";
import { RerenderSlideUseCase } from "@/core/application/use-cases/rerender-slide";
import { SchedulePostUseCase } from "@/core/application/use-cases/schedule-post";
import { UpdateSlideOverridesUseCase } from "@/core/application/use-cases/update-slide-overrides";
import { getRenderSlidePort } from "@/infra/render/bootstrap";
import { getAgendaRepositories } from "@/infra/agenda/bootstrap";
import { resolveEffectiveSlide, type Slide } from "@/core/domain/project/slide";
import type { ArchetypeId } from "@/core/domain/template/blueprint";

export type EditorActionResult = { ok: true; slide: EditorSlideData } | { ok: false; error: string };

function toEditorSlideData(slide: Slide): EditorSlideData {
  const effective = resolveEffectiveSlide(slide);
  return {
    id: slide.id,
    index: slide.index,
    archetypeId: effective.archetypeId,
    content: effective.content,
    variant: slide.variant,
  };
}

// `orgId` chega pré-preenchido via `.bind(null, session.orgId)` na page
// (Server Component) — o Client Component nunca escolhe a própria org.
export async function saveSlide(
  orgId: string,
  slideId: string,
  patch: { archetypeId?: ArchetypeId; texts?: Record<string, string> },
): Promise<EditorActionResult> {
  const session = await getCurrentSession();
  if (!session || session.orgId !== orgId) {
    return { ok: false, error: "Não autorizado." };
  }

  const { slides, projects } = getEditorRepositories();
  const result = await new UpdateSlideOverridesUseCase(slides, projects).execute(orgId, slideId, patch);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, slide: toEditorSlideData(result.value) };
}

export type ExportActionResult = { ok: true; url: string } | { ok: false; error: string };

// Bloco 9: zip com os PNGs + legenda.txt. Roda RerenderSlideUseCase só
// nos slides com override (edição manual ainda não re-renderizada) — os
// demais já estão em dia desde o step "render" do pipeline.
export async function exportProject(orgId: string, projectId: string): Promise<ExportActionResult> {
  const session = await getCurrentSession();
  if (!session || session.orgId !== orgId) {
    return { ok: false, error: "Não autorizado." };
  }

  const { projects, slides, brandKits, media, mediaStorage, exportStorage } = getEditorRepositories();
  const rerenderSlide = new RerenderSlideUseCase(slides, projects, brandKits, getRenderSlidePort());
  const useCase = new ExportProjectUseCase(projects, slides, media, mediaStorage, exportStorage, rerenderSlide);

  const result = await useCase.execute(orgId, projectId);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, url: result.value.publicUrl };
}

export type ScheduleActionResult = { ok: true; scheduledAt: string } | { ok: false; error: string };

// Bloco 10: "Agendar publicação" no Editor → aparece na Agenda.
export async function scheduleProject(
  orgId: string,
  projectId: string,
  scheduledAt: string,
): Promise<ScheduleActionResult> {
  const session = await getCurrentSession();
  if (!session || session.orgId !== orgId) {
    return { ok: false, error: "Não autorizado." };
  }

  const { projects, posts } = getAgendaRepositories();
  const result = await new SchedulePostUseCase(posts, projects).execute(orgId, projectId, { scheduledAt });

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, scheduledAt: result.value.scheduledAt };
}

export async function regenerateMedia(orgId: string, slideId: string): Promise<EditorActionResult> {
  const session = await getCurrentSession();
  if (!session || session.orgId !== orgId) {
    return { ok: false, error: "Não autorizado." };
  }

  const { slides, projects, brandKits } = getEditorRepositories();
  const useCase = new RegenerateSlideMediaUseCase(slides, projects, brandKits, getAIGateway(), new PromptService());
  const result = await useCase.execute(orgId, slideId);

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, slide: toEditorSlideData(result.value) };
}
