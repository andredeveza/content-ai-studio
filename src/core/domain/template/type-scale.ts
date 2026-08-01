import type { ScaleStep } from "@/core/domain/template/variant";

// README, "Blueprints — geometria exata" > escala tipográfica:
// hero 175/185/-0.04em · display 110/118/-0.03em · heading 90/110/-0.02em
// lead 48/62 · body 36/44 · micro 32/40/0.14em
export type TypeRole = "hero" | "display" | "heading" | "lead" | "body" | "micro";

export interface TypeStep {
  // Um estilo de composição declara faixa (ex.: estilo 01 "título
  // 128–148px"); a base do README tem min === max, o que faz o eixo
  // `scaleStep` virar no-op e preserva a geometria original.
  readonly min: number;
  readonly max: number;
  readonly lineHeightRatio: number;
  readonly tracking?: string;
}

export type TypeScale = Readonly<Record<TypeRole, TypeStep>>;

export interface ResolvedTypeStep {
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly tracking?: string;
}

export type ResolvedScale = Readonly<Record<TypeRole, ResolvedTypeStep>>;

function step(min: number, max: number, lineHeight: number, tracking?: string): TypeStep {
  return { min, max, lineHeightRatio: lineHeight / min, ...(tracking ? { tracking } : {}) };
}

export const BASE_TYPE_SCALE: TypeScale = {
  hero: step(175, 175, 185, "-0.04em"),
  display: step(110, 110, 118, "-0.03em"),
  heading: step(90, 90, 110, "-0.02em"),
  lead: step(48, 48, 62),
  body: step(36, 36, 44),
  micro: step(32, 32, 40, "0.14em"),
};

// Proporção local de entrelinha para slots que fogem da razão da escala
// (ex.: "dado" usa 90/100, não 90/110). Mantém o valor literal original
// no contexto default e continua proporcional quando um estilo aumenta a
// fonte — em vez de congelar a entrelinha e apertar o texto.
export function lh(fontSize: number, ratio: number): number {
  return Math.round(fontSize * ratio);
}

function resolveStep(input: TypeStep, scaleStep: ScaleStep): ResolvedTypeStep {
  const fontSize =
    scaleStep === "down" ? input.min : scaleStep === "up" ? input.max : Math.round((input.min + input.max) / 2);
  return {
    fontSize,
    lineHeight: Math.round(fontSize * input.lineHeightRatio),
    ...(input.tracking ? { tracking: input.tracking } : {}),
  };
}

export function resolveScale(scale: TypeScale, scaleStep: ScaleStep): ResolvedScale {
  return {
    hero: resolveStep(scale.hero, scaleStep),
    display: resolveStep(scale.display, scaleStep),
    heading: resolveStep(scale.heading, scaleStep),
    lead: resolveStep(scale.lead, scaleStep),
    body: resolveStep(scale.body, scaleStep),
    micro: resolveStep(scale.micro, scaleStep),
  };
}
