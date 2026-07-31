import { describe, expect, it } from "vitest";
import { filenameTags, splitExcerpts, tokens, topTermsByFrequency } from "@/core/application/services/text-tokens";

describe("tokens (bloco 7) — porte literal do protótipo", () => {
  it("remove pontuação, minúsculiza e filtra palavras curtas e stopwords", () => {
    expect(tokens("Como vender MAIS no Instagram!")).toEqual(["vender", "instagram"]);
  });

  it("mantém acentos (à-ú)", () => {
    expect(tokens("Promoção válida até domingo")).toContain("promoção");
  });

  it("retorna array vazio para texto vazio ou nulo", () => {
    expect(tokens("")).toEqual([]);
    expect(tokens(null)).toEqual([]);
    expect(tokens(undefined)).toEqual([]);
  });
});

describe("topTermsByFrequency (bloco 7)", () => {
  it("ordena por frequência decrescente e limita ao topo N", () => {
    const text = "cafe cafe cafe grao grao especial";
    expect(topTermsByFrequency(text, 2)).toEqual(["cafe", "grao"]);
  });
});

describe("splitExcerpts (bloco 7) — trechos entre 40 e 320 caracteres", () => {
  it("descarta frases curtas demais e mantém as no intervalo certo", () => {
    const curta = "Oi.";
    const media = "Este é um trecho de tamanho razoável para servir de exemplo de excerto.";
    const text = `${curta} ${media}`;
    const excerpts = splitExcerpts(text);
    expect(excerpts).toHaveLength(1);
    expect(excerpts[0]).toBe(media);
  });

  it("descarta frases longas demais (acima de 320 caracteres)", () => {
    const longa = `${"palavra ".repeat(50)}.`;
    expect(splitExcerpts(longa).length).toBe(0);
  });
});

describe("filenameTags (bloco 7) — fallback de topicFit para imagens", () => {
  it("troca hífen/underscore por espaço e tokeniza", () => {
    expect(filenameTags("foto-grao-especial_colheita.jpg")).toEqual(["foto", "grao", "especial", "colheita"]);
  });
});
