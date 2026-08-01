import { describe, expect, it } from "vitest";
import { detectSignal, planCarouselLayout, type LayoutSlideInput } from "@/core/application/services/layout.service";
import { getCompositionStyle } from "@/core/domain/template/composition-styles.catalog";

const NEVOA = getCompositionStyle("nevoa-suave"); // estilo neutro, receitas base
const SEED = "projeto-teste";

function plan(slides: readonly LayoutSlideInput[], analyzedImageCount = 0, style = NEVOA) {
  return planCarouselLayout({ style, seed: SEED, slides, acervo: { analyzedImageCount } });
}

function filler(index: number, body = "texto qualquer sem sinais"): LayoutSlideInput {
  return { index, body };
}

// 5 slides: 0 = capa, 4 = fecho, 1..3 livres para exercitar sinais.
function carousel(middle: Partial<LayoutSlideInput>): LayoutSlideInput[] {
  return [filler(0), { index: 1, body: "texto qualquer sem sinais", ...middle }, filler(2), filler(3), filler(4)];
}

describe("detectSignal — regexes do SelectLayout original, preservadas", () => {
  it("número de passo", () => {
    expect(detectSignal({ index: 1, body: "qualquer", stepNumber: 3 })).toBe("step");
  });
  it("citação entre aspas", () => {
    expect(detectSignal({ index: 1, body: 'Como dizem, "o produto certo encontra o cliente certo"' })).toBe("quote");
  });
  it("citação com atribuição (travessão)", () => {
    expect(detectSignal({ index: 1, body: "O produto certo encontra o cliente certo — Fundador" })).toBe("quote");
  });
  it("percentual ou número grande", () => {
    expect(detectSignal({ index: 1, body: "Aumentamos as vendas em 42% no trimestre" })).toBe("number");
  });
  it("3 a 5 itens curtos", () => {
    expect(
      detectSignal({ index: 1, body: "x", items: ["Planeje a campanha", "Defina o público", "Publique o anúncio"] }),
    ).toBe("list");
  });
  it("mais de 5 itens não conta como lista", () => {
    expect(detectSignal({ index: 1, body: "x", items: ["um", "dois", "três", "quatro", "cinco", "seis"] })).toBe(
      "none",
    );
  });
  it("data com dia, mês e hora", () => {
    expect(detectSignal({ index: 1, body: "Live no dia 12 de agosto às 19h, não perca" })).toBe("date");
  });
});

describe("planCarouselLayout — papel, não índice", () => {
  it("primeiro slide é capa e último é fecho, mesmo com outros sinais", () => {
    const result = plan([
      { index: 0, body: '"citação" — alguém', stepNumber: 1 },
      filler(1),
      { index: 2, body: "qualquer", stepNumber: 2 },
    ]);
    expect(result[0]?.role).toBe("capa");
    expect(result[2]?.role).toBe("fecho");
  });

  it("citação vira papel citacao; número vira papel dado", () => {
    expect(plan(carousel({ body: 'Ele disse: "isso muda tudo" mesmo' }))[1]?.role).toBe("citacao");
    expect(plan(carousel({ body: "Aumentamos as vendas em 42% no trimestre" }))[1]?.role).toBe("dado");
  });

  // As especializações preservam a expressividade do SelectLayout antigo.
  it("passo numerado ainda vira numerada; data ainda vira evento", () => {
    expect(plan(carousel({ stepNumber: 3 }))[1]?.archetypeId).toBe("numerada");
    expect(plan(carousel({ body: "Live no dia 12 de agosto às 19h, não perca" }))[1]?.archetypeId).toBe("evento");
  });

  it("usa o papel sugerido pelo ResearchService quando não há sinal forte", () => {
    expect(plan(carousel({ plannedRole: "prova" }))[1]?.role).toBe("prova");
  });

  it("papel sugerido nunca sobrepõe posição nem sinal forte", () => {
    expect(plan(carousel({ plannedRole: "prova", body: "Cresceu 42% no mês" }))[1]?.role).toBe("dado");
  });
});

// É a razão de existir da camada: trocar de estilo remonta o carrossel
// sem reescrever uma palavra do texto.
describe("planCarouselLayout — o estilo resolve a composição", () => {
  const slides = carousel({ plannedRole: "argumento" });

  it("estilos diferentes produzem arquétipos diferentes para o mesmo texto", () => {
    const a = plan(slides, 1, getCompositionStyle("manchete-sangrada")).map((s) => s.archetypeId);
    const b = plan(slides, 1, getCompositionStyle("canto-escuro")).map((s) => s.archetypeId);
    expect(a).not.toEqual(b);
  });

  it("noite-futurista mantém todo slide no modo escuro", () => {
    const result = plan(slides, 0, getCompositionStyle("noite-futurista"));
    expect(result.every((s) => s.variant.mode === "dark")).toBe(true);
  });

  it("é determinístico: mesma semente, mesmo plano", () => {
    expect(plan(slides, 1)).toEqual(plan(slides, 1));
  });
});

// README, "Critério de pronto": o carrossel sai "com pelo menos uma
// imagem vinda do acervo do cliente". Era exatamente o que falhava.
describe("planCarouselLayout — garantia de foto real do acervo", () => {
  const semSinais = [filler(0), filler(1), filler(2), filler(3), filler(4), filler(5), filler(6)];

  it("com acervo, algum slide pede mídia", () => {
    expect(plan(semSinais, 3).some((s) => s.wantsMedia)).toBe(true);
  });

  it("sem acervo, nenhum slide é promovido a foto", () => {
    const result = plan(semSinais, 0);
    expect(result.some((s) => s.wantsMedia)).toBe(false);
  });

  it("a promoção nunca cai na capa nem no fecho", () => {
    const result = plan(semSinais, 3);
    const promoted = result.filter((s) => s.wantsMedia).map((s) => s.index);
    expect(promoted).not.toContain(0);
    expect(promoted).not.toContain(semSinais.length - 1);
  });

  it("estilo que já pede foto não precisa de promoção extra", () => {
    const result = plan(semSinais, 3, getCompositionStyle("manchete-sangrada"));
    expect(result.some((s) => s.wantsMedia)).toBe(true);
  });
});
