import type { ArchetypeId } from "@/core/domain/template/blueprint";
import type { SlideContent } from "@/core/domain/template/slide-content";

export interface Slide {
  readonly id: string;
  readonly projectId: string;
  readonly index: number;
  readonly archetypeId: ArchetypeId;
  readonly content: SlideContent;
  readonly mediaId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NewSlide {
  readonly index: number;
  readonly archetypeId: ArchetypeId;
  readonly content: SlideContent;
}
