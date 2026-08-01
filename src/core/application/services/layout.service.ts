import type { ArchetypeId } from "@/core/domain/template/blueprint";
import type { CompositionStyle, ContentSignal, SlideRecipe } from "@/core/domain/template/composition-style";
import type { SlideRole } from "@/core/domain/template/slide-role";
import {
  distributeModes,
  resolveVariant,
  type LayoutVariant,
  type SlideMode,
} from "@/core/domain/template/variant";

// ---------------------------------------------------------------------
// Sinais de conteúdo — regexes portadas VERBATIM do SelectLayout
// original (README, "Seleção automática de layout"). O que mudou é o que
// elas devolvem: antes um arquétipo direto, agora um papel + sinal, para
// o estilo de composição resolver a composição daquele papel.
// ---------------------------------------------------------------------

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

export interface LayoutSlideInput {
  readonly index: number;
  // Papel sugerido pelo ResearchService. Sinais fortes de conteúdo têm
  // precedência sobre ele; posição (capa/fecho) tem precedência sobre tudo.
  readonly plannedRole?: SlideRole;
  readonly body: string;
  readonly items?: readonly string[];
  readonly stepNumber?: number | null;
}

export interface LayoutSelection {
  readonly index: number;
  readonly role: SlideRole;
  readonly archetypeId: ArchetypeId;
  readonly variant: LayoutVariant;
  readonly wantsMedia: boolean;
}

export interface CarouselLayoutInput {
  readonly style: CompositionStyle;
  // Determinismo: mesma semente ⇒ mesmo layout. Usar `project.id`.
  readonly seed: string;
  readonly slides: readonly LayoutSlideInput[];
  readonly acervo: { readonly analyzedImageCount: number };
}

export function detectSignal(slide: LayoutSlideInput): ContentSignal {
  if (slide.stepNumber != null) return "step";
  if (isQuote(slide.body)) return "quote";
  if (hasNumberSignal(slide.body)) return "number";
  if (isShortItemList(slide.items)) return "list";
  if (hasDateSignal(slide.body)) return "date";
  return "none";
}

// Ordem de precedência igual à tabela do README: posição primeiro,
// depois sinal de conteúdo, e o papel sugerido pela IA como último
// desempate.
function roleFor(slide: LayoutSlideInput, total: number, signal: ContentSignal): SlideRole {
  if (slide.index === 0) return "capa";
  if (slide.index === total - 1) return "fecho";
  if (signal === "quote") return "citacao";
  if (signal === "number") return "dado";
  if (slide.plannedRole && slide.plannedRole !== "capa" && slide.plannedRole !== "fecho") {
    return slide.plannedRole;
  }
  return "argumento";
}

function recipeFor(style: CompositionStyle, role: SlideRole): SlideRecipe {
  const recipes = style.slideRecipes;
  return recipes[role] ?? recipes.argumento ?? recipes.capa!;
}

// "Papel do slide, não índice": o papel escolhe a receita, a receita
// escolhe o arquétipo — e o sinal de conteúdo só especializa dentro do
// que o estilo permitiu.
function archetypeFor(recipe: SlideRecipe, signal: ContentSignal): ArchetypeId {
  return recipe.specializations?.[signal] ?? recipe.archetypeId;
}

// Ordem de preferência para promover um slide a portador de foto real
// quando o acervo tem imagem mas nenhuma receita pediu mídia. Capa e
// fecho ficam de fora, salvo quando o próprio estilo já os quer com
// foto (01 e 05 são capas fotográficas).
const PROMOTION_PREFERENCE: readonly SlideRole[] = ["prova", "citacao", "argumento", "dado"];

function findMediaArchetype(style: CompositionStyle): ArchetypeId | null {
  for (const recipe of Object.values(style.slideRecipes)) {
    if (recipe.wantsMedia) return recipe.archetypeId;
  }
  return null;
}

// README, "Pipeline de geração" + "Critério de pronto": o carrossel tem
// que sair "com pelo menos uma imagem vinda do acervo do cliente". Antes
// isso podia silenciosamente dar zero — `foto-total` era o ÚLTIMO
// critério do SelectLayout e perdia para citação/número/lista/data, e a
// capa e o fecho eram forçados por posição. Aqui a decisão é do
// carrossel inteiro, não de cada slide isolado.
function applyPhotoBias(
  selections: LayoutSelection[],
  style: CompositionStyle,
  acervoCount: number,
): LayoutSelection[] {
  if (acervoCount <= 0) return selections;
  if (selections.some((selection) => selection.wantsMedia)) return selections;

  const mediaArchetype = findMediaArchetype(style) ?? "foto-total";
  const last = selections.length - 1;

  for (const role of PROMOTION_PREFERENCE) {
    const target = selections.findIndex(
      (selection) => selection.role === role && selection.index !== 0 && selection.index !== last,
    );
    if (target === -1) continue;
    selections[target] = { ...selections[target]!, archetypeId: mediaArchetype, wantsMedia: true };
    return selections;
  }

  return selections;
}

// SelectLayout do README, agora no nível do carrossel: distribuição de
// modo claro/escuro e garantia de foto real não são decisões que se
// possam tomar slide a slide.
export function planCarouselLayout(input: CarouselLayoutInput): readonly LayoutSelection[] {
  const { style, seed, slides } = input;
  const total = slides.length;

  const base = slides.map((slide) => {
    const signal = detectSignal(slide);
    const role = roleFor(slide, total, signal);
    const recipe = recipeFor(style, role);
    return { slide, signal, role, recipe };
  });

  const fixedModes: (SlideMode | undefined)[] = base.map((entry) => entry.recipe.mode);
  const modes = distributeModes(total, fixedModes, seed);

  const selections: LayoutSelection[] = base.map((entry, i) => ({
    index: entry.slide.index,
    role: entry.role,
    archetypeId: archetypeFor(entry.recipe, entry.signal),
    variant: { ...resolveVariant(entry.recipe.axes, `${seed}:${i}`), mode: modes[i] ?? "light" },
    wantsMedia: entry.recipe.wantsMedia ?? false,
  }));

  return applyPhotoBias(selections, style, input.acervo.analyzedImageCount);
}
