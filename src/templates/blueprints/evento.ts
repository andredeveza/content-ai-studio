import type { Blueprint } from "@/core/domain/template/blueprint";
import { band, mid, MARGIN } from "@/templates/geometry";

export const evento: Blueprint = {
  id: "evento",
  name: "Evento",
  role: "Bloco de data destacado com título e detalhe.",
  slots: (canvas) => {
    const { top, height } = band(canvas.h);
    const y = mid(top, height, 644);
    const contentWidth = canvas.w - 2 * MARGIN;

    return [
      {
        kind: "shape",
        key: "dateBadge",
        box: { x: MARGIN, y, w: 260, h: 260 },
        color: "accent",
        radius: 30,
      },
      {
        kind: "text",
        key: "day",
        box: { x: MARGIN, y: y + 42, w: 260, h: 130 },
        fontSize: 120,
        lineHeight: 126,
        font: "display",
        color: "title",
        align: "center",
      },
      {
        kind: "text",
        key: "month",
        box: { x: MARGIN, y: y + 178, w: 260, h: 50 },
        fontSize: 32,
        lineHeight: 40,
        tracking: "0.14em",
        weight: 600,
        font: "mono",
        color: "title",
        align: "center",
      },
      {
        kind: "text",
        key: "heading",
        box: { x: MARGIN, y: y + 310, w: contentWidth, h: 208 },
        fontSize: 90,
        lineHeight: 104,
        tracking: "-0.02em",
        font: "display",
        color: "title",
      },
      {
        kind: "text",
        key: "detail",
        box: { x: MARGIN, y: y + 548, w: 780, h: 96 },
        fontSize: 36,
        lineHeight: 48,
        weight: 400,
        font: "body",
        color: "textLight",
      },
    ];
  },
};
