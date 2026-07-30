import { describe, expect, it } from "vitest";
import { mapGenericCopyToSlideContent } from "@/core/application/services/slide-content-mapper";
import { buildSlideContentSchema } from "@/core/application/dto/slide-content.dto";
import type { GenericSlideCopy } from "@/core/application/dto/copy.dto";
import { ALL_ARCHETYPE_IDS } from "@/templates/blueprints";

function baseCopy(overrides: Partial<GenericSlideCopy> = {}): GenericSlideCopy {
  return {
    index: 0,
    kicker: "KICKER",
    heading: "Título",
    lead: "Apoio",
    body: "corpo do slide",
    quote: "",
    author: "",
    number: "",
    items: [],
    day: "",
    month: "",
    detail: "",
    ctaLabel: "",
    ...overrides,
  };
}

describe("mapGenericCopyToSlideContent (bloco 6)", () => {
  it("gera conteúdo válido (pelo schema do bloco 4) para todos os 8 arquétipos", () => {
    const copy = baseCopy({
      quote: "frase forte",
      author: "Fulano",
      number: "01",
      items: ["Um", "Dois", "Três"],
      day: "12",
      month: "AGOSTO",
      detail: "19h",
      ctaLabel: "Fale com a gente",
    });

    for (const archetypeId of ALL_ARCHETYPE_IDS) {
      const content = mapGenericCopyToSlideContent(archetypeId, copy);
      const schema = buildSlideContentSchema(archetypeId);
      const result = schema.safeParse(content);
      expect(result.success, `arquétipo "${archetypeId}": ${JSON.stringify(result.success ? null : result.error.issues)}`).toBe(true);
    }
  });

  it("usa o body como fallback de quote quando a IA não separou quote/author", () => {
    const copy = baseCopy({ body: "o produto certo encontra o cliente certo", quote: "" });
    const content = mapGenericCopyToSlideContent("citacao", copy);
    expect(content.texts.quote).toBe("o produto certo encontra o cliente certo");
  });

  it("lista-icone usa só os 3 primeiros itens", () => {
    const copy = baseCopy({ items: ["A", "B", "C", "D", "E"] });
    const content = mapGenericCopyToSlideContent("lista-icone", copy);
    expect(content.texts.item1).toBe("A");
    expect(content.texts.item2).toBe("B");
    expect(content.texts.item3).toBe("C");
  });
});
