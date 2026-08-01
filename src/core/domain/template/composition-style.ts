import type { ArchetypeId, BandRule, ColorRole } from "@/core/domain/template/blueprint";
import type { SlideRole } from "@/core/domain/template/slide-role";
import type { TypeScale } from "@/core/domain/template/type-scale";
import type { SlideMode, VariantAxisConstraints } from "@/core/domain/template/variant";

// README, "Estilos de composição": o template define ONDE as coisas
// ficam, o estilo define COMO aquilo se compõe. "Sem essa camada, todo
// carrossel sai com o mesmo esqueleto e a única diferença entre dois
// clientes vira cor e fonte — que é exatamente o que mata o potencial
// viral."
export type StyleRequirementNeed =
  | { readonly kind: "image"; readonly ratio?: "4:5" | "1:1" | "9:16"; readonly darkBand?: "top" | "bottom"; readonly min?: number }
  | { readonly kind: "numeric-series" }
  | { readonly kind: "quote-source" }
  | { readonly kind: "logo" };

export type StyleFormat = "carousel" | "single";
export type PhotoTreatment = "bleed" | "card" | "column" | "none";

// Ornamento declarativo. Os estilos 04/05/06/07 carregam geometria que
// nenhum dos 8 arquétipos expressa (cartão de thread, filetes, manchas
// borradas, guias de coluna). Mantê-los como DADO — renderizados pelo
// template engine como shape/scrim por baixo dos slots — preserva a
// promessa do README de que "acrescentar o oitavo é inserir uma linha,
// nenhum componente muda". Valores verticais continuam derivados de H
// (`cyRatio`, `yFromBottom`), nunca absolutos.
export type DecorSpec =
  | { readonly kind: "card"; readonly w: number; readonly h: number; readonly radius: number; readonly color: ColorRole; readonly opacity?: number }
  | { readonly kind: "blob"; readonly cx: number; readonly cyRatio: number; readonly r: number; readonly blur: number; readonly opacity: number; readonly color: ColorRole }
  | { readonly kind: "rule"; readonly yFromTop?: number; readonly yFromBottom?: number; readonly color: ColorRole }
  | { readonly kind: "column-guides"; readonly xs: readonly number[]; readonly color: ColorRole; readonly opacity: number };

export interface StyleChrome {
  readonly footerVariant: "pill" | "clean";
  readonly logoPosition: "top" | "bottom";
  // Estilo 08: selo "conteúdo na legenda".
  readonly badge?: string;
}

// Sinal forte detectado no corpo do slide. Não é o papel: um
// "argumento" pode vir em forma de passo numerado, de lista curta ou de
// data — e o estilo decide se quer compor isso de um jeito próprio.
export type ContentSignal = "step" | "quote" | "number" | "list" | "date" | "none";

export interface SlideRecipe {
  readonly archetypeId: ArchetypeId;
  readonly axes: VariantAxisConstraints;
  // Especializações opcionais por sinal de conteúdo: preservam a
  // expressividade dos 8 arquétipos (um slide com "passo 2" continua
  // virando `numerada`) sem furar o modelo de papéis do README — quem
  // decide continua sendo o estilo, como dado.
  readonly specializations?: Readonly<Partial<Record<ContentSignal, ArchetypeId>>>;
  // Modo fixo (ex.: 02 "noite futurista" é sempre escuro). Ausente = o
  // planejador distribui claro/escuro pelo carrossel.
  readonly mode?: SlideMode;
  // Este papel quer carregar uma foto real do acervo.
  readonly wantsMedia?: boolean;
}

export interface CompositionStyle {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly sourceRef: string;
  readonly format: StyleFormat;
  readonly margin: number;
  readonly typeScale: TypeScale;
  readonly photoTreatment: PhotoTreatment;
  readonly bandRule: BandRule;
  readonly chrome: StyleChrome;
  readonly decor: readonly DecorSpec[];
  readonly slideRecipes: Readonly<Partial<Record<SlideRole, SlideRecipe>>>;
  readonly requires: readonly StyleRequirementNeed[];
}

export { COMPOSITION_STYLES, getCompositionStyle, STYLE_SLUGS } from "@/core/domain/template/composition-styles.catalog";
