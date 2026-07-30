import type { NewSlide, Slide } from "@/core/domain/project/slide";
import type { SlideContent } from "@/core/domain/template/slide-content";

export interface SlideRepository {
  upsertMany(projectId: string, slides: readonly NewSlide[]): Promise<Slide[]>;
  listByProject(projectId: string): Promise<Slide[]>;
  updateContent(slideId: string, content: SlideContent): Promise<Slide | null>;
  setMediaId(slideId: string, mediaId: string): Promise<Slide | null>;
}
