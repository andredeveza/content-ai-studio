import type { BandRule, BlueprintContext, Canvas } from "@/core/domain/template/blueprint";
import { getCompositionStyle } from "@/core/domain/template/composition-styles.catalog";
import type { DecorSpec } from "@/core/domain/template/composition-style";
import { BASE_TYPE_SCALE, resolveScale, type ResolvedScale } from "@/core/domain/template/type-scale";
import { DEFAULT_VARIANT, type LayoutVariant } from "@/core/domain/template/variant";
import { band, DEFAULT_BAND_RULE, DEFAULT_MARGIN } from "@/templates/geometry";

export type { BlueprintContext };

export interface BlueprintContextOptions {
  readonly margin?: number;
  readonly bandRule?: BandRule;
  readonly scale?: ResolvedScale;
  readonly variant?: LayoutVariant;
  readonly decor?: readonly DecorSpec[];
  readonly badge?: string;
}

// Reconstrói o contexto a partir do que é PERSISTIDO/TRAFEGADO
// (`projects.style_id` + `slides.variant`), em vez de serializar o
// contexto inteiro. Uma fonte de verdade só: os dois lados do serviço de
// render (app na Vercel e worker no Render.com) chamam esta função com
// os mesmos dois campos e chegam à mesma geometria — sem isso o preview
// e o PNG final poderiam divergir.
//
// Estilo desconhecido ou variante ausente (projeto antigo, anterior à
// camada de estilos) cai no contexto default, que é a geometria original.
export function contextForStyle(
  canvas: Canvas,
  styleSlug: string | null | undefined,
  variant: LayoutVariant | null | undefined,
): BlueprintContext {
  if (!styleSlug) return blueprintContext(canvas, { ...(variant ? { variant } : {}) });

  let style;
  try {
    style = getCompositionStyle(styleSlug);
  } catch {
    return blueprintContext(canvas, { ...(variant ? { variant } : {}) });
  }

  const effective = variant ?? DEFAULT_VARIANT;
  return blueprintContext(canvas, {
    margin: style.margin,
    bandRule: style.bandRule,
    scale: resolveScale(style.typeScale, effective.scaleStep),
    variant: effective,
    decor: style.decor,
    ...(style.chrome.badge ? { badge: style.chrome.badge } : {}),
  });
}

// Sem opções, devolve exatamente os valores que estavam hardcoded nos
// blueprints antes do refactor — travado pelo golden
// (`blueprints/geometry-golden.test.ts`).
export function blueprintContext(canvas: Canvas, options: BlueprintContextOptions = {}): BlueprintContext {
  const variant = options.variant ?? DEFAULT_VARIANT;
  return {
    canvas,
    margin: options.margin ?? DEFAULT_MARGIN,
    band: band(canvas.h, options.bandRule ?? DEFAULT_BAND_RULE),
    scale: options.scale ?? resolveScale(BASE_TYPE_SCALE, variant.scaleStep),
    variant,
    decor: options.decor ?? [],
    ...(options.badge ? { badge: options.badge } : {}),
  };
}
