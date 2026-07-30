import { describe, expect, it } from "vitest";
import { buildSlideContentSchema } from "@/core/application/dto/slide-content.dto";

describe("buildSlideContentSchema (bloco 4)", () => {
  it("exige todas as chaves de texto do arquétipo", () => {
    const schema = buildSlideContentSchema("cover-centro");
    const result = schema.safeParse({ texts: { heading: "Título" } });
    expect(result.success).toBe(false);
  });

  it("aceita conteúdo completo do arquétipo", () => {
    const schema = buildSlideContentSchema("cover-centro");
    const result = schema.safeParse({
      texts: { kicker: "KICKER", heading: "Título forte", lead: "Apoio" },
    });
    expect(result.success).toBe(true);
  });

  it("não exige o slot com staticText (glifo de aspas de 'citacao')", () => {
    const schema = buildSlideContentSchema("citacao");
    const result = schema.safeParse({
      texts: { quote: "A frase", author: "Fulano" },
    });
    expect(result.success).toBe(true);
  });

  it("exige URL válida para slots de mídia", () => {
    const schema = buildSlideContentSchema("foto-total");
    const result = schema.safeParse({
      texts: { heading: "Manchete" },
      media: { media: "não-é-url" },
    });
    expect(result.success).toBe(false);
  });
});
