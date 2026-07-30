import type { Blueprint } from "@/core/domain/template/blueprint";
import { band, mid, MARGIN } from "@/templates/geometry";

export const fecho: Blueprint = {
  id: "fecho",
  name: "Fechamento",
  role: "Chamada final com ação clara e assinatura da marca.",
  slots: (canvas) => {
    const { top, height } = band(canvas.h);
    const y = mid(top, height, 544);
    const contentWidth = canvas.w - 2 * MARGIN;

    return [
      {
        kind: "text",
        key: "heading",
        box: { x: MARGIN, y, w: contentWidth, h: 236 },
        fontSize: 110,
        lineHeight: 118,
        tracking: "-0.03em",
        font: "display",
        color: "title",
        align: "center",
      },
      {
        kind: "text",
        key: "lead",
        box: { x: MARGIN, y: y + 276, w: contentWidth, h: 88 },
        fontSize: 36,
        lineHeight: 44,
        weight: 400,
        font: "body",
        color: "textLight",
        align: "center",
      },
      {
        kind: "text",
        key: "cta",
        box: { x: 290, y: y + 424, w: 500, h: 120 },
        fontSize: 34,
        lineHeight: 34,
        tracking: "0.1em",
        weight: 700,
        font: "mono",
        color: "title",
        background: "accent",
        radius: 60,
        align: "center",
      },
    ];
  },
};
