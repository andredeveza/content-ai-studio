import type { ArchetypeId } from "@/core/domain/template/blueprint";
import type { SlideContent } from "@/core/domain/template/slide-content";
import type { SlideRole } from "@/core/domain/template/slide-role";
import type { LayoutVariant } from "@/core/domain/template/variant";

// Edição manual no Editor (bloco 8) por cima do que o pipeline gerou —
// nunca sobrescreve `content`/`archetypeId` originais, só empilha por
// cima (resolveEffectiveSlide mescla os dois na hora de exibir/renderizar).
export interface SlideOverrides {
  // Troca de "variante" (grid de arquétipos no inspector).
  readonly archetypeId?: ArchetypeId;
  // slot.key -> texto editado.
  readonly texts?: Record<string, string>;
  // slot.key -> URL de mídia trocada manualmente (ex.: "Regerar imagem").
  readonly media?: Record<string, string>;
}

export interface Slide {
  readonly id: string;
  readonly projectId: string;
  readonly index: number;
  readonly archetypeId: ArchetypeId;
  // Papel editorial e variante escolhidos pelo planejador. Persistidos
  // porque a geometria agora depende deles: sem isso o preview do editor
  // e o PNG do Puppeteer podem divergir.
  readonly role: SlideRole | null;
  readonly variant: LayoutVariant | null;
  readonly content: SlideContent;
  readonly overrides: SlideOverrides | null;
  readonly mediaId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NewSlide {
  readonly index: number;
  readonly archetypeId: ArchetypeId;
  readonly role?: SlideRole;
  readonly variant?: LayoutVariant;
  readonly content: SlideContent;
}

export interface EffectiveSlide {
  readonly archetypeId: ArchetypeId;
  readonly content: SlideContent;
}

// Resolve o que deve ser exibido/renderizado: overrides.archetypeId troca
// o arquétipo inteiro; overrides.texts/media mesclam por cima de
// content.texts/content.media (chave a chave, não substituem o objeto
// inteiro).
export function resolveEffectiveSlide(slide: Pick<Slide, "archetypeId" | "content" | "overrides">): EffectiveSlide {
  const overrides = slide.overrides;
  if (!overrides) {
    return { archetypeId: slide.archetypeId, content: slide.content };
  }

  return {
    archetypeId: overrides.archetypeId ?? slide.archetypeId,
    content: {
      ...slide.content,
      texts: { ...slide.content.texts, ...overrides.texts },
      media: { ...slide.content.media, ...overrides.media },
    },
  };
}
