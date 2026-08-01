// Geometria compartilhada pelos 8 arquétipos (README, seção "Blueprints —
// geometria exata"; espelha band()/mid() de
// design/Biblioteca de Blueprints.dc.html, que é especificação executável
// — porte quase literal, só trocando JS solto por TS tipado).
//
// Faixas reservadas ao chrome: topo 80..160, base H-190..H-80. Todo
// conteúdo de slot (exceto mídia full-bleed, que sangra por baixo do
// chrome de propósito) vive entre `band(H).top` e `band(H).bottom` — nunca
// posição absoluta, para o mesmo blueprint refluir em 1080 e 1350.

import type { BandRule, ContentBand } from "@/core/domain/template/blueprint";
import type { TextBlockPosition } from "@/core/domain/template/variant";

export type { BandRule, ContentBand };

export const DEFAULT_MARGIN = 80;

// Mantido como alias para não quebrar quem já importava `MARGIN`; o
// valor por estilo chega via `BlueprintContext.margin`.
export const MARGIN = DEFAULT_MARGIN;

export const CHROME_TOP_BAND = { y: 80, height: 80 } as const;

export function chromeBottomBand(canvasHeight: number): { readonly y: number; readonly height: number } {
  return { y: canvasHeight - 190, height: 110 };
}

// `ContentBand` e `BandRule` vivem no domínio (`template/blueprint.ts`)
// porque `BlueprintContext` os referencia — reexportados acima por
// conveniência de quem já importava daqui.

// Faixa de conteúdo default (README: `band_rule`). Todo estilo que não
// declara o seu herda este.
export const DEFAULT_BAND_RULE: BandRule = { top: 200, bottomInset: 230 };

export function band(canvasHeight: number, rule: BandRule = DEFAULT_BAND_RULE): ContentBand {
  const top = rule.top;
  const bottom = canvasHeight - rule.bottomInset;
  return { top, bottom, height: bottom - top };
}

// Centraliza um bloco de altura `blockHeight` dentro da faixa de conteúdo,
// nunca deixando `top` recuar antes do início da faixa.
export function mid(top: number, contentHeight: number, blockHeight: number): number {
  return top + Math.max(0, (contentHeight - blockHeight) / 2);
}

export interface FlexibleBlock {
  // Quantas linhas o slot quer ter quando há espaço sobrando.
  readonly lines: number;
  readonly lineHeight: number;
}

// README, "Regra de clamp obrigatória": "Restrinja o container — não
// confie no prompt para limitar palavras." Aqui isso vale também para a
// COMPOSIÇÃO: se a escala de um estilo (ex.: 03 "revista autoral" no
// degrau `up`, num canvas 1:1) faz o bloco ficar mais alto que a faixa
// de conteúdo, corta linha dos slots flexíveis em vez de deixar o texto
// invadir o rodapé. Nunca desce abaixo de 1 linha.
//
// Devolve a altura final de cada bloco flexível, na ordem recebida.
export function shrinkToBand(fixedHeight: number, flexible: readonly FlexibleBlock[], bandHeight: number): number[] {
  const lines = flexible.map((block) => block.lines);
  const total = () => fixedHeight + lines.reduce((sum, n, i) => sum + n * flexible[i]!.lineHeight, 0);

  while (total() > bandHeight) {
    // Corta do bloco que hoje ocupa mais altura — mantém a hierarquia
    // tipográfica proporcional em vez de zerar o menor primeiro.
    let target = -1;
    let tallest = 0;
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i]! <= 1) continue;
      const heightOf = lines[i]! * flexible[i]!.lineHeight;
      if (heightOf > tallest) {
        tallest = heightOf;
        target = i;
      }
    }
    if (target === -1) break; // todos já em 1 linha: a faixa é pequena demais
    lines[target] = lines[target]! - 1;
  }

  return lines.map((n, i) => n * flexible[i]!.lineHeight);
}

// Generaliza `mid()` para o eixo `textBlock` da variante. "center" é
// exatamente o `mid()` de antes — é o que mantém o golden intacto. O
// bloco se move DENTRO da faixa, nunca para fora dela.
export function anchor(
  position: TextBlockPosition,
  top: number,
  contentHeight: number,
  blockHeight: number,
): number {
  if (position === "top") return top;
  if (position === "bottom") return top + Math.max(0, contentHeight - blockHeight);
  return mid(top, contentHeight, blockHeight);
}
