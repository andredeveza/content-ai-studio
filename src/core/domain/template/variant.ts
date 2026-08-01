// README, "Blueprints": "Dentro do blueprint escolhido, sorteie entre
// eixos permitidos (posição do bloco de texto, alinhamento, degrau da
// escala, logo topo/base, rodapé pill/limpo). Cada eixo tem valores
// validados — nenhuma combinação pode produzir texto ilegível."
//
// A ilegibilidade não é evitada por lista negra de combinações: é
// estrutural. `scaleStep` resolve para um ponto entre `min` e `max` da
// escala do estilo, e o `lineHeight` resultante alimenta o
// `computeClamp` inalterado — fonte maior significa menos linhas, nunca
// transbordo (ver `templates/clamp.ts`).

export type TextBlockPosition = "top" | "center" | "bottom";
export type TextAlignAxis = "left" | "center";
export type ScaleStep = "down" | "base" | "up";
export type SlideMode = "light" | "dark";
export type LogoPosition = "top" | "bottom";
export type FooterVariant = "pill" | "clean";

export interface LayoutVariant {
  readonly textBlock: TextBlockPosition;
  readonly align: TextAlignAxis;
  readonly scaleStep: ScaleStep;
  readonly logo: LogoPosition;
  readonly footer: FooterVariant;
  readonly mode: SlideMode;
}

export interface VariantAxisConstraints {
  readonly textBlock: readonly TextBlockPosition[];
  readonly align: readonly TextAlignAxis[];
  readonly scaleStep: readonly ScaleStep[];
  readonly logo: readonly LogoPosition[];
  readonly footer: readonly FooterVariant[];
}

// Contexto default do render: reproduz exatamente a geometria que os 8
// arquétipos produziam antes dos estilos de composição existirem
// (`textBlock: "center"` faz `anchor()` devolver o mesmo que o antigo
// `mid()`; `scaleStep: "base"` com escala base min===max é no-op).
// Travado pelo golden em `blueprints/geometry-golden.test.ts`.
export const DEFAULT_VARIANT: LayoutVariant = {
  textBlock: "center",
  align: "center",
  scaleStep: "base",
  logo: "top",
  footer: "clean",
  mode: "light",
};

export const FULL_AXES: VariantAxisConstraints = {
  textBlock: ["top", "center", "bottom"],
  align: ["left", "center"],
  scaleStep: ["down", "base", "up"],
  logo: ["top", "bottom"],
  footer: ["pill", "clean"],
};

// PRNG determinístico. O README exige que o progresso "nunca dependa de
// intervalo que possa ser recriado pelo remount"; a mesma lógica vale
// para geometria: regerar o mesmo projeto tem que dar o mesmo layout, ou
// o preview do editor e o PNG do Puppeteer divergem. Daí semente
// explícita em vez de `Math.random`.
export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(values: readonly T[], rng: () => number, fallback: T): T {
  if (values.length === 0) return fallback;
  return values[Math.floor(rng() * values.length)] ?? fallback;
}

// `mode` NÃO sai daqui — é decidido no nível do carrossel por
// `distributeModes`, porque o README manda distribuir os modos, não
// sorteá-los slide a slide.
export function resolveVariant(axes: VariantAxisConstraints, seed: string): Omit<LayoutVariant, "mode"> {
  const rng = mulberry32(hashSeed(seed));
  return {
    textBlock: pick(axes.textBlock, rng, DEFAULT_VARIANT.textBlock),
    align: pick(axes.align, rng, DEFAULT_VARIANT.align),
    scaleStep: pick(axes.scaleStep, rng, DEFAULT_VARIANT.scaleStep),
    logo: pick(axes.logo, rng, DEFAULT_VARIANT.logo),
    footer: pick(axes.footer, rng, DEFAULT_VARIANT.footer),
  };
}

function alternate(start: SlideMode, step: number): SlideMode {
  const flipped = step % 2 !== 0;
  if (!flipped) return start;
  return start === "light" ? "dark" : "light";
}

// README, "Brand Kit": "o feed alterna claro e escuro de propósito — o
// seletor de layout deve DISTRIBUIR modos, não sortear."
//
// Alternância pura já garante "nunca 3 iguais seguidos". O único ajuste
// é para contagem par: alternando do índice 0 ao n-1, capa e fecho
// cairiam em modos diferentes, então um "degrau" duplicado é inserido
// numa posição derivada da semente — o que mantém capa e fecho no mesmo
// modo com no máximo 2 iguais seguidos.
export function distributeModes(
  count: number,
  fixed: readonly (SlideMode | undefined)[],
  seed: string,
): readonly SlideMode[] {
  if (count <= 0) return [];

  const rng = mulberry32(hashSeed(`${seed}:modes`));
  const start: SlideMode = rng() < 0.5 ? "light" : "dark";
  const pivot = count % 2 === 0 && count > 2 ? 1 + Math.floor(rng() * (count - 2)) : -1;

  const modes: SlideMode[] = [];
  let phase = 0;
  for (let index = 0; index < count; index += 1) {
    if (index === pivot) phase += 1;
    modes.push(fixed[index] ?? alternate(start, index + phase));
  }

  // Um modo fixado pela receita do estilo pode criar uma corrida de 3+.
  // Conserta virando UM dos três — preferindo o do meio, mas caindo para
  // os vizinhos quando o meio é fixo. Bug real pego em geração de
  // verdade: no estilo "canto escuro" (que fixa dark em capa e prova) a
  // versão anterior só tentava o meio, via que ele era fixo e desistia,
  // deixando três slides escuros seguidos no feed.
  for (let index = 1; index < modes.length - 1; index += 1) {
    const isRun = modes[index - 1] === modes[index] && modes[index] === modes[index + 1];
    if (!isRun) continue;

    const candidate = [index, index + 1, index - 1].find((i) => fixed[i] === undefined);
    if (candidate === undefined) continue; // os três são fixos: escolha explícita do estilo

    modes[candidate] = modes[candidate] === "light" ? "dark" : "light";
  }

  return modes;
}
