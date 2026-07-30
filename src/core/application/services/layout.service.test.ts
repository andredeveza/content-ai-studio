import { describe, expect, it } from "vitest";
import { selectLayout } from "@/core/application/services/layout.service";

const BASE = { slideIndex: 1, totalSlides: 5, body: "texto qualquer sem sinais" };

describe("selectLayout (bloco 4)", () => {
  it("primeiro slide é sempre cover-centro, mesmo com outros sinais presentes", () => {
    expect(
      selectLayout({ ...BASE, slideIndex: 0, stepNumber: 1, body: '"citação" — alguém' }),
    ).toBe("cover-centro");
  });

  it("último slide é sempre fecho, mesmo com outros sinais presentes", () => {
    expect(selectLayout({ ...BASE, slideIndex: 4, totalSlides: 5, stepNumber: 2 })).toBe("fecho");
  });

  it("número de passo vira numerada", () => {
    expect(selectLayout({ ...BASE, stepNumber: 3 })).toBe("numerada");
  });

  it("citação entre aspas vira citacao", () => {
    expect(selectLayout({ ...BASE, body: 'Como dizem, "o produto certo encontra o cliente certo"' })).toBe(
      "citacao",
    );
  });

  it("citação com atribuição (travessão) vira citacao", () => {
    expect(selectLayout({ ...BASE, body: "O produto certo encontra o cliente certo — Fundador" })).toBe(
      "citacao",
    );
  });

  it("percentual ou número grande no corpo vira dado", () => {
    expect(selectLayout({ ...BASE, body: "Aumentamos as vendas em 42% no trimestre" })).toBe("dado");
  });

  it("3 a 5 itens curtos viram lista-icone", () => {
    expect(
      selectLayout({
        ...BASE,
        items: ["Planeje a campanha", "Defina o público", "Publique o anúncio"],
      }),
    ).toBe("lista-icone");
  });

  it("mais de 5 itens não conta como lista-icone", () => {
    expect(
      selectLayout({
        ...BASE,
        items: ["um", "dois", "três", "quatro", "cinco", "seis"],
      }),
    ).toBe("cover-centro");
  });

  it("data com dia, mês e hora vira evento", () => {
    expect(selectLayout({ ...BASE, body: "Live no dia 12 de agosto às 19h, não perca" })).toBe("evento");
  });

  it("foto forte disponível vira foto-total quando nenhum outro sinal bate primeiro", () => {
    expect(selectLayout({ ...BASE, hasStrongPhoto: true })).toBe("foto-total");
  });

  it("nenhum sinal cai no fallback cover-centro", () => {
    expect(selectLayout(BASE)).toBe("cover-centro");
  });

  it("respeita a ordem de precedência: número bate antes de foto forte", () => {
    expect(selectLayout({ ...BASE, body: "Cresceu 30% este mês", hasStrongPhoto: true })).toBe("dado");
  });
});
