// Regra de clamp obrigatória (README): texto gerado por IA tem
// comprimento imprevisível, então todo slot de texto precisa de altura
// máxima e clamp de linhas — nunca confie no prompt para limitar
// palavras. `maxLines` é sempre derivado da geometria do próprio slot
// (box.h / lineHeight), nunca hardcoded por arquétipo.

export interface ClampResult {
  readonly maxLines: number;
  readonly maxHeightPx: number;
}

export function computeClamp(boxHeightPx: number, lineHeightPx: number, override?: number): ClampResult {
  const fitLines = Math.max(1, Math.floor(boxHeightPx / lineHeightPx));
  const maxLines = override && override > 0 ? Math.min(override, fitLines) : fitLines;
  // Nunca ultrapassa a altura da própria box: quando uma única linha já é
  // mais alta que o slot (ex.: glifo decorativo grande numa box apertada),
  // `height` + `overflow:hidden` já cortam ali — `max-height` tem que
  // concordar com esse limite, não ficar maior e enganar quem lê o CSS.
  const maxHeightPx = Math.min(maxLines * lineHeightPx, boxHeightPx);
  return { maxLines, maxHeightPx };
}
