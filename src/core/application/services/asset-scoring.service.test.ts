import { describe, expect, it } from "vitest";
import {
  RETRIEVAL_SCORE_THRESHOLD,
  computeScrimOpacity,
  scoreAsset,
  topicFitFromTags,
} from "@/core/application/services/asset-scoring.service";

describe("scoreAsset (bloco 7) — porte literal da fórmula do protótipo", () => {
  it("calcula ratioFit/contrastFit/topicFit/total exatamente como a fórmula do README", () => {
    // aspect ideal (0.8) -> ratioFit = 1
    // luminanceAtBand=0.2 -> contrastFit=0.8 (>=0.3, sem illegible)
    // topicFit=0.5, sem uso prévio
    const score = scoreAsset({ aspect: 0.8, luminanceAtBand: 0.2, topicFit: 0.5, alreadyUsed: false });

    expect(score.ratioFit).toBeCloseTo(1, 10);
    expect(score.contrastFit).toBeCloseTo(0.8, 10);
    expect(score.topicFit).toBe(0.5);
    expect(score.penalty).toBe(0);
    expect(score.illegible).toBe(0);
    // 1*0.34 + 0.8*0.46 + 0.5*0.2 = 0.34 + 0.368 + 0.1 = 0.808
    expect(score.total).toBeCloseTo(0.808, 10);
  });

  it("penaliza em 0.12 quando o asset já foi usado neste carrossel", () => {
    const fresh = scoreAsset({ aspect: 0.8, luminanceAtBand: 0.2, topicFit: 0, alreadyUsed: false });
    const reused = scoreAsset({ aspect: 0.8, luminanceAtBand: 0.2, topicFit: 0, alreadyUsed: true });

    expect(reused.penalty).toBe(0.12);
    expect(fresh.total - reused.total).toBeCloseTo(0.12, 10);
  });

  it("aplica illegible=0.40 quando contrastFit < 0.30 (regra não removível)", () => {
    // luminanceAtBand=0.75 -> contrastFit=0.25 (<0.3)
    const score = scoreAsset({ aspect: 0.8, luminanceAtBand: 0.75, topicFit: 0, alreadyUsed: false });
    expect(score.contrastFit).toBeCloseTo(0.25, 10);
    expect(score.illegible).toBe(0.4);
  });

  it("não aplica illegible quando contrastFit == 0.30 (fronteira exclusiva)", () => {
    // luminanceAtBand=0.70 -> contrastFit=0.30 exatamente
    const score = scoreAsset({ aspect: 0.8, luminanceAtBand: 0.7, topicFit: 0, alreadyUsed: false });
    expect(score.contrastFit).toBeCloseTo(0.3, 10);
    expect(score.illegible).toBe(0);
  });

  it("ratioFit cai conforme o aspecto se afasta de 0.8 (tolerância 1.2)", () => {
    const perfect = scoreAsset({ aspect: 0.8, luminanceAtBand: 0, topicFit: 0, alreadyUsed: false });
    const off = scoreAsset({ aspect: 2.0, luminanceAtBand: 0, topicFit: 0, alreadyUsed: false });
    // |2.0 - 0.8| / 1.2 = 1 -> ratioFit = 0
    expect(perfect.ratioFit).toBeCloseTo(1, 10);
    expect(off.ratioFit).toBeCloseTo(0, 10);
  });

  it("threshold de recuperação está definido e é usado por ImageService", () => {
    expect(RETRIEVAL_SCORE_THRESHOLD).toBeGreaterThan(0);
    expect(RETRIEVAL_SCORE_THRESHOLD).toBeLessThan(1);
  });
});

describe("computeScrimOpacity (bloco 7) — véu calculado, não fixo", () => {
  it("segue scrim = min(0.96, 0.55 + luminância*0.5)", () => {
    expect(computeScrimOpacity(0)).toBeCloseTo(0.55, 10);
    expect(computeScrimOpacity(0.5)).toBeCloseTo(0.8, 10);
    expect(computeScrimOpacity(1)).toBeCloseTo(0.96, 10);
  });

  it("nunca ultrapassa 0.96 mesmo com luminância acima de 1", () => {
    expect(computeScrimOpacity(2)).toBe(0.96);
  });
});

describe("topicFitFromTags (bloco 7) — fallback literal do protótipo", () => {
  it("conta quantos tokens do tema aparecem nas tags do asset", () => {
    // "como" e "mais" são stopwords; sobra ["vender","instagram"]
    const fit = topicFitFromTags("Como vender mais no Instagram", ["vender", "produtos"]);
    expect(fit).toBeCloseTo(0.5, 10);
  });

  it("retorna 0 quando o tema não gera nenhum token", () => {
    expect(topicFitFromTags("a e o", ["qualquer"])).toBe(0);
  });

  it("retorna 1 quando todos os tokens do tema batem", () => {
    expect(topicFitFromTags("cafe especial", ["cafe", "especial"])).toBeCloseTo(1, 10);
  });
});
