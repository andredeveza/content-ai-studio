import type { Blueprint } from "@/core/domain/template/blueprint";
import { lh } from "@/core/domain/template/type-scale";
import { anchor } from "@/templates/geometry";

export const evento: Blueprint = {
  id: "evento",
  name: "Evento",
  role: "Bloco de data destacado com título e detalhe.",
  slots: (ctx) => {
    const { margin, scale, variant, canvas } = ctx;
    const { top, height } = ctx.band;
    const y = anchor(variant.textBlock, top, height, 644);
    const contentWidth = canvas.w - 2 * margin;

    return [
      {
        kind: "shape",
        key: "dateBadge",
        box: { x: margin, y, w: 260, h: 260 },
        color: "accent",
        radius: 30,
      },
      {
        kind: "text",
        key: "day",
        box: { x: margin, y: y + 42, w: 260, h: 130 },
        fontSize: 120,
        lineHeight: 126,
        font: "display",
        color: "title",
        align: "center",
      },
      {
        kind: "text",
        key: "month",
        box: { x: margin, y: y + 178, w: 260, h: 50 },
        fontSize: scale.micro.fontSize,
        lineHeight: scale.micro.lineHeight,
        tracking: scale.micro.tracking,
        weight: 600,
        font: "mono",
        color: "title",
        align: "center",
      },
      {
        kind: "text",
        key: "heading",
        box: { x: margin, y: y + 310, w: contentWidth, h: 208 },
        fontSize: scale.heading.fontSize,
        lineHeight: lh(scale.heading.fontSize, 104 / 90),
        tracking: scale.heading.tracking,
        font: "display",
        color: "title",
      },
      {
        kind: "text",
        key: "detail",
        box: { x: margin, y: y + 548, w: 780, h: 96 },
        fontSize: scale.body.fontSize,
        lineHeight: lh(scale.body.fontSize, 48 / 36),
        weight: 400,
        font: "body",
        color: "textLight",
      },
    ];
  },
};
