import { describe, expect, it } from "vitest";
import { resolveEffectiveSlide, type Slide } from "@/core/domain/project/slide";

const now = "2026-01-01T00:00:00.000Z";

function baseSlide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: "slide-1",
    projectId: "project-1",
    index: 0,
    archetypeId: "cover-centro",
    content: { texts: { kicker: "DICA", heading: "Título original", lead: "Apoio original" } },
    overrides: null,
    mediaId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("resolveEffectiveSlide (bloco 8)", () => {
  it("sem overrides, devolve o conteúdo original tal como está", () => {
    const slide = baseSlide();
    const effective = resolveEffectiveSlide(slide);
    expect(effective.archetypeId).toBe("cover-centro");
    expect(effective.content).toEqual(slide.content);
  });

  it("mescla textos editados por cima do conteúdo original, chave a chave", () => {
    const slide = baseSlide({ overrides: { texts: { heading: "Título editado" } } });
    const effective = resolveEffectiveSlide(slide);
    expect(effective.content.texts.heading).toBe("Título editado");
    expect(effective.content.texts.kicker).toBe("DICA");
    expect(effective.content.texts.lead).toBe("Apoio original");
  });

  it("troca o arquétipo inteiro quando overrides.archetypeId está presente", () => {
    const slide = baseSlide({ overrides: { archetypeId: "fecho" } });
    const effective = resolveEffectiveSlide(slide);
    expect(effective.archetypeId).toBe("fecho");
  });

  it("mescla media por cima do conteúdo original", () => {
    const slide = baseSlide({
      content: { texts: { heading: "Foto" }, media: { media: "https://old.example.com/a.jpg" } },
      overrides: { media: { media: "https://new.example.com/b.jpg" } },
    });
    const effective = resolveEffectiveSlide(slide);
    expect(effective.content.media?.media).toBe("https://new.example.com/b.jpg");
  });
});
