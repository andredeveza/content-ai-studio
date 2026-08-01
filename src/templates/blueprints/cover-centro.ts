import type { Blueprint } from "@/core/domain/template/blueprint";
import { anchor } from "@/templates/geometry";

export const coverCentro: Blueprint = {
  id: "cover-centro",
  name: "Capa centrada",
  role: "Abertura de alto impacto, manchete no eixo central.",
  slots: (ctx) => {
    const { margin, scale, variant } = ctx;
    const { top, height } = ctx.band;
    const y = anchor(variant.textBlock, top, height, 602);
    const contentWidth = ctx.canvas.w - 2 * margin;

    return [
      {
        kind: "text",
        key: "kicker",
        box: { x: margin, y, w: contentWidth, h: 60 },
        fontSize: scale.micro.fontSize,
        lineHeight: scale.micro.lineHeight,
        tracking: scale.micro.tracking,
        weight: 600,
        font: "mono",
        color: "accent",
        align: "center",
      },
      {
        kind: "text",
        key: "heading",
        box: { x: margin, y: y + 120, w: contentWidth, h: 354 },
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
        box: { x: margin, y: y + 514, w: contentWidth, h: 88 },
        fontSize: scale.body.fontSize,
        lineHeight: scale.body.lineHeight,
        weight: 400,
        font: "body",
        color: "textLight",
        align: "center",
      },
    ];
  },
};
