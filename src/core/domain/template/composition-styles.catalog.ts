import type { CompositionStyle, SlideRecipe } from "@/core/domain/template/composition-style";
import { BASE_TYPE_SCALE, type TypeScale } from "@/core/domain/template/type-scale";
import type { VariantAxisConstraints } from "@/core/domain/template/variant";

// Catálogo dos 8 estilos do README ("Estilos de composição"). É DADO,
// não código: um nono estilo é uma entrada a mais neste array e nenhum
// componente muda — que é exatamente a promessa da spec.
//
// Fica em TypeScript, e não numa tabela, de propósito: `slideRecipes`
// referencia `ArchetypeId` e uniões de eixo que só existem em código.
// Aqui um erro de digitação é erro de compilação; numa tabela seria
// falha de runtime dentro do worker, descoberta pelo cliente. O que
// varia por projeto (`projects.style_id`, `slides.role`,
// `slides.variant`) esse sim é persistido. Ver PROGRESSO.md.

function scale(overrides: Partial<TypeScale> = {}): TypeScale {
  return { ...BASE_TYPE_SCALE, ...overrides };
}

function step(min: number, max: number, lineHeight: number, tracking?: string) {
  return { min, max, lineHeightRatio: lineHeight / min, ...(tracking ? { tracking } : {}) };
}

// Eixos conservadores: o texto centralizado no bloco central é o que os
// arquétipos já faziam. Estilos com assinatura própria abrem mais eixos.
const CALM_AXES: VariantAxisConstraints = {
  textBlock: ["center"],
  align: ["center"],
  scaleStep: ["base"],
  logo: ["top"],
  footer: ["clean"],
};

const OPEN_AXES: VariantAxisConstraints = {
  textBlock: ["top", "center", "bottom"],
  align: ["left", "center"],
  scaleStep: ["down", "base", "up"],
  logo: ["top", "bottom"],
  footer: ["pill", "clean"],
};

const recipe = (
  archetypeId: SlideRecipe["archetypeId"],
  axes: VariantAxisConstraints = CALM_AXES,
  extra: Omit<SlideRecipe, "archetypeId" | "axes"> = {},
): SlideRecipe => ({ archetypeId, axes, ...extra });

// Receitas padrão por papel — cada estilo sobrescreve o que muda a sua
// assinatura. Todo estilo cobre pelo menos capa/argumento/fecho
// (invariante checada em teste).
const BASE_RECIPES = {
  capa: recipe("cover-centro"),
  argumento: recipe("lista-icone"),
  dado: recipe("dado"),
  citacao: recipe("citacao", CALM_AXES, { wantsMedia: true }),
  prova: recipe("foto-total", CALM_AXES, { wantsMedia: true }),
  fecho: recipe("fecho"),
} as const;

export const COMPOSITION_STYLES: readonly CompositionStyle[] = [
  {
    id: "01",
    slug: "manchete-sangrada",
    name: "Manchete sangrada",
    sourceRef: "Content Machine · Principal",
    format: "carousel",
    // README: "margem 36px, título 128–148px, foto sangrada".
    margin: 36,
    typeScale: scale({ display: step(128, 148, 138, "-0.03em") }),
    photoTreatment: "bleed",
    // Margem apertada implica faixa mais generosa que o default.
    bandRule: { top: 160, bottomInset: 190 },
    chrome: { footerVariant: "clean", logoPosition: "top" },
    decor: [],
    slideRecipes: {
      ...BASE_RECIPES,
      capa: recipe("foto-total", OPEN_AXES, { wantsMedia: true }),
      prova: recipe("foto-total", OPEN_AXES, { wantsMedia: true }),
    },
    requires: [{ kind: "image", darkBand: "bottom" }],
  },
  {
    id: "02",
    slug: "noite-futurista",
    name: "Noite futurista",
    sourceRef: "Content Machine · Futurista",
    format: "carousel",
    margin: 80,
    typeScale: scale(),
    photoTreatment: "card",
    bandRule: { top: 200, bottomInset: 230 },
    chrome: { footerVariant: "pill", logoPosition: "top" },
    // "glow só no fundo" — mancha larga e suave, nunca atrás de texto.
    decor: [{ kind: "blob", cx: 540, cyRatio: 0.28, r: 420, blur: 90, opacity: 0.35, color: "primary" }],
    slideRecipes: Object.fromEntries(
      // "fundo noturno fixo": o modo não é distribuído, é sempre escuro.
      Object.entries(BASE_RECIPES).map(([role, base]) => [role, { ...base, mode: "dark" as const }]),
    ),
    requires: [],
  },
  {
    id: "03",
    slug: "revista-autoral",
    name: "Revista autoral",
    sourceRef: "Content Machine · Autoral",
    format: "carousel",
    margin: 80,
    // "serifada no título interno" — papel `editorial` do Brand Kit.
    typeScale: scale({ heading: step(84, 96, 104, "-0.02em") }),
    photoTreatment: "column",
    bandRule: { top: 200, bottomInset: 230 },
    chrome: { footerVariant: "clean", logoPosition: "top" },
    decor: [],
    slideRecipes: {
      ...BASE_RECIPES,
      argumento: recipe("citacao", CALM_AXES, { wantsMedia: true }),
      prova: recipe("citacao", CALM_AXES, { wantsMedia: true }),
    },
    requires: [{ kind: "image", ratio: "4:5" }],
  },
  {
    id: "04",
    slug: "fio-de-thread",
    name: "Fio de thread",
    sourceRef: "Content Machine · Twitter",
    format: "carousel",
    margin: 56,
    typeScale: scale({ heading: step(76, 90, 92, "-0.02em") }),
    photoTreatment: "none",
    bandRule: { top: 200, bottomInset: 230 },
    chrome: { footerVariant: "clean", logoPosition: "top" },
    // README: "cartão 968×1170 r=34, avatar + handle no topo".
    decor: [{ kind: "card", w: 968, h: 1170, radius: 34, color: "panelLight", opacity: 0.96 }],
    slideRecipes: { ...BASE_RECIPES, prova: recipe("lista-icone"), citacao: recipe("citacao", CALM_AXES) },
    requires: [],
  },
  {
    id: "05",
    slug: "canto-escuro",
    name: "Canto escuro",
    sourceRef: "RLVNT Studios · Dark",
    format: "carousel",
    margin: 80,
    // "coluna estreita, numeral 180px".
    typeScale: scale({ hero: step(180, 180, 190, "-0.04em") }),
    photoTreatment: "bleed",
    bandRule: { top: 200, bottomInset: 230 },
    chrome: { footerVariant: "clean", logoPosition: "bottom" },
    // "filetes a 130/1200" — 1200 medido do topo num canvas 1350, ou
    // seja 150 a partir da base (derivado de H, não absoluto).
    decor: [
      { kind: "rule", yFromTop: 130, color: "slate" },
      { kind: "rule", yFromBottom: 150, color: "slate" },
    ],
    slideRecipes: {
      ...BASE_RECIPES,
      capa: recipe("foto-total", OPEN_AXES, { wantsMedia: true, mode: "dark" }),
      argumento: recipe("numerada"),
      prova: recipe("foto-total", OPEN_AXES, { wantsMedia: true, mode: "dark" }),
    },
    requires: [{ kind: "image", ratio: "4:5", darkBand: "bottom" }],
  },
  {
    id: "06",
    slug: "nevoa-suave",
    name: "Névoa suave",
    sourceRef: "theshubhamdhage",
    format: "carousel",
    margin: 80,
    typeScale: scale(),
    photoTreatment: "none",
    bandRule: { top: 200, bottomInset: 230 },
    chrome: { footerVariant: "clean", logoPosition: "top" },
    // README: "3 manchas blur 60px, opacidade ≤ .42".
    decor: [
      { kind: "blob", cx: 220, cyRatio: 0.22, r: 300, blur: 60, opacity: 0.42, color: "primary" },
      { kind: "blob", cx: 860, cyRatio: 0.5, r: 260, blur: 60, opacity: 0.32, color: "accent" },
      { kind: "blob", cx: 420, cyRatio: 0.82, r: 320, blur: 60, opacity: 0.26, color: "brand" },
    ],
    slideRecipes: BASE_RECIPES,
    requires: [],
  },
  {
    id: "07",
    slug: "grade-silenciosa",
    name: "Grade silenciosa",
    sourceRef: "Shu Ha Ri",
    format: "carousel",
    // README: "4 colunas fixas 96·392·688·984, título ≤ 92px".
    margin: 96,
    typeScale: scale({ heading: step(80, 92, 100, "-0.02em"), display: step(92, 92, 100, "-0.03em") }),
    photoTreatment: "none",
    bandRule: { top: 200, bottomInset: 230 },
    chrome: { footerVariant: "clean", logoPosition: "top" },
    decor: [{ kind: "column-guides", xs: [96, 392, 688, 984], color: "gray", opacity: 0.18 }],
    slideRecipes: { ...BASE_RECIPES, capa: recipe("cover-centro"), prova: recipe("lista-icone") },
    requires: [],
  },
  {
    id: "08",
    slug: "capa-de-campanha",
    name: "Capa de campanha",
    sourceRef: "PDF Canva · HS Endoscopia",
    // Único `single` do catálogo: "o corpo do conteúdo vive na legenda,
    // não em slides".
    format: "single",
    // README dá 50–70px; 60 é o meio (a faixa é artefato de medir um PDF).
    margin: 60,
    typeScale: scale(),
    photoTreatment: "bleed",
    bandRule: { top: 200, bottomInset: 230 },
    chrome: { footerVariant: "clean", logoPosition: "top", badge: "conteúdo na legenda" },
    decor: [],
    slideRecipes: {
      capa: recipe("foto-total", OPEN_AXES, { wantsMedia: true }),
      argumento: recipe("cover-centro"),
      fecho: recipe("fecho"),
    },
    requires: [],
  },
] as const;

export const STYLE_SLUGS: readonly string[] = COMPOSITION_STYLES.map((style) => style.slug);

export const DEFAULT_STYLE_SLUG = "manchete-sangrada";

export function getCompositionStyle(slug: string): CompositionStyle {
  const found = COMPOSITION_STYLES.find((style) => style.slug === slug);
  if (!found) throw new Error(`Estilo de composição desconhecido: "${slug}".`);
  return found;
}
