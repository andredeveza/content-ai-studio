// Geometria compartilhada pelos 8 arquétipos (README, seção "Blueprints —
// geometria exata"; espelha band()/mid() de
// design/Biblioteca de Blueprints.dc.html, que é especificação executável
// — porte quase literal, só trocando JS solto por TS tipado).
//
// Faixas reservadas ao chrome: topo 80..160, base H-190..H-80. Todo
// conteúdo de slot (exceto mídia full-bleed, que sangra por baixo do
// chrome de propósito) vive entre `band(H).top` e `band(H).bottom` — nunca
// posição absoluta, para o mesmo blueprint refluir em 1080 e 1350.

export const MARGIN = 80;

export const CHROME_TOP_BAND = { y: 80, height: 80 } as const;

export function chromeBottomBand(canvasHeight: number): { readonly y: number; readonly height: number } {
  return { y: canvasHeight - 190, height: 110 };
}

export interface ContentBand {
  readonly top: number;
  readonly bottom: number;
  readonly height: number;
}

export function band(canvasHeight: number): ContentBand {
  const top = 200;
  const bottom = canvasHeight - 230;
  return { top, bottom, height: bottom - top };
}

// Centraliza um bloco de altura `blockHeight` dentro da faixa de conteúdo,
// nunca deixando `top` recuar antes do início da faixa.
export function mid(top: number, contentHeight: number, blockHeight: number): number {
  return top + Math.max(0, (contentHeight - blockHeight) / 2);
}
