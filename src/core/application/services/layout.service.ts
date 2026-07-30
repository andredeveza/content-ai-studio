import type { ArchetypeId } from "@/core/domain/template/blueprint";

export interface LayoutSelectionInput {
  readonly slideIndex: number;
  readonly totalSlides: number;
  // Presença de número de ordem (passo 1, 2, 3…) — sinal de "estrutura em
  // passos" (README).
  readonly stepNumber?: number | null;
  readonly body: string;
  // Itens curtos candidatos a virar bullets (ex.: linhas separadas pelo
  // CopyService). O corpo bruto não é bom sinal de "3 a 5 itens" sozinho.
  readonly items?: readonly string[];
  // "Acervo tem imagem com faixa escura" — decidido pelo RetrieveAssets
  // (bloco 7); aqui só recebemos o booleano já calculado.
  readonly hasStrongPhoto?: boolean;
}

const MONTHS =
  "janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro";
const DATE_REGEX = new RegExp(`\\b\\d{1,2}\\s+de\\s+(${MONTHS})\\b`, "i");
const TIME_REGEX = /\b\d{1,2}(:\d{2})?\s?h\b/i;
const NUMBER_SIGNAL_REGEX = /\d+(?:[.,]\d+)?\s?%|\b\d{3,}\b/;
const QUOTE_REGEX = /["“][^"”]{5,}["”]/;
const ATTRIBUTION_REGEX = /—\s*\S+/;

function isQuote(body: string): boolean {
  return QUOTE_REGEX.test(body) || ATTRIBUTION_REGEX.test(body);
}

function hasNumberSignal(body: string): boolean {
  return NUMBER_SIGNAL_REGEX.test(body);
}

function hasDateSignal(body: string): boolean {
  return DATE_REGEX.test(body) && TIME_REGEX.test(body);
}

function countWords(line: string): number {
  return line.trim().split(/\s+/).filter(Boolean).length;
}

function isShortItemList(items: readonly string[] | undefined): boolean {
  if (!items || items.length < 3 || items.length > 5) return false;
  return items.every((item) => countWords(item) <= 9);
}

// Seleção automática de layout (README, "Blueprints" > "Seleção
// automática de layout"): regra determinística, roda antes de renderizar.
// A ordem da tabela é a ordem de precedência — a primeira condição que
// bate decide, mesmo que sinais posteriores também seriam verdadeiros.
export function selectLayout(input: LayoutSelectionInput): ArchetypeId {
  if (input.slideIndex === 0) return "cover-centro";
  if (input.slideIndex === input.totalSlides - 1) return "fecho";
  if (input.stepNumber != null) return "numerada";
  if (isQuote(input.body)) return "citacao";
  if (hasNumberSignal(input.body)) return "dado";
  if (isShortItemList(input.items)) return "lista-icone";
  if (hasDateSignal(input.body)) return "evento";
  if (input.hasStrongPhoto) return "foto-total";
  return "cover-centro";
}
