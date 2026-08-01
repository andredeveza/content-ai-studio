import type { Blueprint } from "@/core/domain/template/blueprint";
import { anchor } from "@/templates/geometry";

export const fecho: Blueprint = {
  id: "fecho",
  name: "Fechamento",
  role: "Chamada final com ação clara e assinatura da marca.",
  slots: (ctx) => {
    const { margin, scale, variant } = ctx;
    const { top, height } = ctx.band;
    const y = anchor(variant.textBlock, top, height, 544);
    const contentWidth = ctx.canvas.w - 2 * margin;

    return [
      {
        kind: "text",
        key: "heading",
        box: { x: margin, y, w: contentWidth, h: 236 },
        fontSize: scale.display.fontSize,
        lineHeight: scale.display.lineHeight,
        tracking: scale.display.tracking,
        font: "display",
        color: "title",
        align: "center",
      },
      {
        kind: "text",
        key: "lead",
        box: { x: margin, y: y + 276, w: contentWidth, h: 88 },
        fontSize: scale.body.fontSize,
        lineHeight: scale.body.lineHeight,
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
