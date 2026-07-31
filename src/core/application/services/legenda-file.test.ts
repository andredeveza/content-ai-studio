import { describe, expect, it } from "vitest";
import { buildLegendaFile } from "@/core/application/services/legenda-file";

describe("buildLegendaFile (bloco 9)", () => {
  it("junta legenda, hashtags e cta separados por linha em branco", () => {
    const text = buildLegendaFile("Como vender mais.", ["marketing", "vendas"], "Fale com a gente");
    expect(text).toBe("Como vender mais.\n\n#marketing #vendas\n\nFale com a gente");
  });

  it("omite hashtags quando a lista está vazia", () => {
    const text = buildLegendaFile("Legenda", [], "CTA");
    expect(text).toBe("Legenda\n\nCTA");
  });

  it("omite partes nulas sem deixar linhas em branco sobrando", () => {
    expect(buildLegendaFile(null, [], null)).toBe("");
    expect(buildLegendaFile("Só legenda", [], null)).toBe("Só legenda");
  });
});
