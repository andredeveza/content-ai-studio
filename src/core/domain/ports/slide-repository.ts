import type { NewSlide, Slide, SlideOverrides } from "@/core/domain/project/slide";
import type { SlideContent } from "@/core/domain/template/slide-content";

export interface SlideRepository {
  upsertMany(projectId: string, slides: readonly NewSlide[]): Promise<Slide[]>;
  listByProject(projectId: string): Promise<Slide[]>;
  findById(slideId: string): Promise<Slide | null>;
  updateContent(slideId: string, content: SlideContent): Promise<Slide | null>;
  setMediaId(slideId: string, mediaId: string): Promise<Slide | null>;
  // Editor (bloco 8): grava o objeto de overrides inteiro (já mesclado
  // pelo use-case) — `null` reverte o slide pro que o pipeline gerou.
  updateOverrides(slideId: string, overrides: SlideOverrides | null): Promise<Slide | null>;
}
