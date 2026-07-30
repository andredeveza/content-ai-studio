import type { Blueprint } from "@/core/domain/template/blueprint";
import { band, MARGIN } from "@/templates/geometry";
import type { Slot } from "@/core/domain/template/blueprint";

export const listaIcone: Blueprint = {
  id: "lista-icone",
  name: "Lista com ícone",
  role: "Itens curtos, cada um com marcador à esquerda.",
  slots: (canvas) => {
    const { top, height } = band(canvas.h);
    const step = Math.min(150, (height - 240 - 88) / 2);
    const contentWidth = canvas.w - 2 * MARGIN;

    const slots: Slot[] = [
      {
        kind: "text",
        key: "heading",
        box: { x: MARGIN, y: top, w: contentWidth, h: 200 },
        fontSize: 90,
        lineHeight: 100,
        tracking: "-0.02em",
        font: "display",
        color: "title",
      },
    ];

    for (let i = 0; i < 3; i += 1) {
      const y = top + 240 + i * step;
      slots.push({
        kind: "shape",
        key: `bullet${i + 1}`,
        box: { x: MARGIN, y, w: 88, h: 88 },
        color: "panelLight",
        radius: 24,
      });
      slots.push({
        kind: "text",
        key: `item${i + 1}`,
        box: { x: 200, y: y + 6, w: 800, h: 76 },
        fontSize: 44,
        lineHeight: 56,
        weight: 600,
        font: "body",
        color: "title",
      });
    }

    return slots;
  },
};
