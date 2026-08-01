import type { BandRule, BlueprintContext, Canvas } from "@/core/domain/template/blueprint";
import { BASE_TYPE_SCALE, resolveScale, type ResolvedScale } from "@/core/domain/template/type-scale";
import { DEFAULT_VARIANT, type LayoutVariant } from "@/core/domain/template/variant";
import { band, DEFAULT_BAND_RULE, DEFAULT_MARGIN } from "@/templates/geometry";

export type { BlueprintContext };

export interface BlueprintContextOptions {
  readonly margin?: number;
  readonly bandRule?: BandRule;
  readonly scale?: ResolvedScale;
  readonly variant?: LayoutVariant;
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
  };
}
