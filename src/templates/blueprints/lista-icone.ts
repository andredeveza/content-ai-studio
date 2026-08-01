import type { Blueprint, Slot } from "@/core/domain/template/blueprint";
import { lh } from "@/core/domain/template/type-scale";

export const listaIcone: Blueprint = {
  id: "lista-icone",
  name: "Lista com ícone",
  role: "Itens curtos, cada um com marcador à esquerda.",
  slots: (ctx) => {
    const { margin, scale, canvas } = ctx;
    const { top, height } = ctx.band;
    const step = Math.min(150, (height - 240 - 88) / 2);
    const contentWidth = canvas.w - 2 * margin;
    const headingLh = lh(scale.heading.fontSize, 100 / 90);
    const headingH = 2 * headingLh;

    const slots: Slot[] = [
      {
        kind: "text",
        key: "heading",
        box: { x: margin, y: top, w: contentWidth, h: headingH },
        fontSize: scale.heading.fontSize,
        lineHeight: headingLh,
        tracking: scale.heading.tracking,
        font: "display",
        color: "title",
      },
    ];

    for (let i = 0; i < 3; i += 1) {
      const y = top + 240 + i * step;
      slots.push({
        kind: "shape",
        key: `bullet${i + 1}`,
        box: { x: margin, y, w: 88, h: 88 },
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
