import { tokens } from "@/core/application/services/text-tokens";

// Porte quase literal da fórmula de `build()` em
// design/Acervo Inteligente.dc.html, também documentada no README
// ("Acervo / RAG" > "Recuperação"):
//
//   ratioFit    = 1 - min(1, |aspect - 0.8| / 1.2)
//   contrastFit = 1 - luminância da faixa onde o título vai
//   topicFit    = similaridade semântica com o tema
//   penalty     = 0.12 se o asset já foi usado neste carrossel
//   illegible   = 0.40 se contrastFit < 0.30
//   total       = ratioFit*0.34 + contrastFit*0.46 + topicFit*0.20 - penalty - illegible
//
// `illegible` existe para que legibilidade vença variedade — sem ele o
// sistema escolhe foto clara e o título desaparece. NÃO REMOVER (README).

const IDEAL_ASPECT = 0.8; // 4:5 — fixo como no protótipo, não varia por `project.ratio`
const ASPECT_TOLERANCE = 1.2;
const CONTRAST_ILLEGIBLE_THRESHOLD = 0.3;
const ILLEGIBLE_PENALTY = 0.4;
const REUSE_PENALTY = 0.12;

const WEIGHT_RATIO = 0.34;
const WEIGHT_CONTRAST = 0.46;
const WEIGHT_TOPIC = 0.2;

// O README não fixa um número para "passa do limite" — 0.5 é a mesma
// escolha já feita no ImageService do bloco 6.
export const RETRIEVAL_SCORE_THRESHOLD = 0.5;

// Piso do passe de garantia: quando o carrossel inteiro terminou sem
// NENHUM asset do acervo e o cliente tem fotos analisadas, vale a pena
// aceitar um match mediano em vez de entregar um carrossel 100% de IA —
// o critério de pronto do README pede "pelo menos uma imagem vinda do
// acervo do cliente". Um match ilegível continua barrado em qualquer
// piso; a legibilidade do match mediano fica por conta do véu calculado.
export const FALLBACK_SCORE_FLOOR = 0.3;

export interface AssetScoreInput {
  readonly aspect: number;
  // Luminância (0..1) da faixa onde o texto do slide vai ancorar — topo
  // ou base, depende do arquétipo escolhido (bloco 4).
  readonly luminanceAtBand: number;
  readonly topicFit: number;
  readonly alreadyUsed: boolean;
}

export interface AssetScore {
  readonly ratioFit: number;
  readonly contrastFit: number;
  readonly topicFit: number;
  readonly penalty: number;
  readonly illegible: number;
  readonly total: number;
}

export function scoreAsset(input: AssetScoreInput): AssetScore {
  const ratioFit = 1 - Math.min(1, Math.abs(input.aspect - IDEAL_ASPECT) / ASPECT_TOLERANCE);
  const contrastFit = 1 - input.luminanceAtBand;
  const penalty = input.alreadyUsed ? REUSE_PENALTY : 0;
  const illegible = contrastFit < CONTRAST_ILLEGIBLE_THRESHOLD ? ILLEGIBLE_PENALTY : 0;
  const total = ratioFit * WEIGHT_RATIO + contrastFit * WEIGHT_CONTRAST + input.topicFit * WEIGHT_TOPIC - penalty - illegible;

  return { ratioFit, contrastFit, topicFit: input.topicFit, penalty, illegible, total };
}

// Véu (scrim) calculado, não fixo (README): quanto mais clara a faixa
// atrás do texto, mais forte o véu precisa ser para o título continuar
// legível. `scrim = min(0.96, 0.55 + luminânciaDaFaixa * 0.5)`.
export function computeScrimOpacity(luminanceAtBand: number): number {
  return Math.min(0.96, 0.55 + luminanceAtBand * 0.5);
}

// topicFit "de produção" é embedding visual/semântico (README); este é
// o fallback literal do protótipo — nome de arquivo / termos do PDF —
// usado sempre que não há embedding indexado (ex.: Hugging Face
// desligado, feature-flag padrão do MVP).
export function topicFitFromTags(theme: string, assetTags: readonly string[]): number {
  const themeTokens = tokens(theme);
  if (themeTokens.length === 0) return 0;

  let hit = 0;
  for (const token of themeTokens) {
    if (assetTags.includes(token)) hit += 1;
  }
  return hit / themeTokens.length;
}
