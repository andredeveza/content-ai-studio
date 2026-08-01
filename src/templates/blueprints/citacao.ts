import type { Blueprint } from "@/core/domain/template/blueprint";
import { lh } from "@/core/domain/template/type-scale";
import { anchor } from "@/templates/geometry";

export const citacao: Blueprint = {
  id: "citacao",
  name: "Citação",
  role: "Cartão translúcido sobre foto, com marca de aspas.",
  slots: (ctx) => {
    const { margin, scale, variant, canvas } = ctx;
    const { top, bottom, height } = ctx.band;
    const y = anchor(variant.textBlock, top, height, 560);
    const cardWidth = canvas.w - 2 * margin - 1;

    return [
      { kind: "media", key: "media", box: { x: 0, y: 0, w: canvas.w, h: canvas.h }, bleed: true },
      {
        kind: "shape",
        key: "card",
        box: { x: margin, y: top, w: cardWidth, h: bottom - top },
        color: "bgLight",
        opacity: 0.9,
        radius: 30,
      },
      {
        kind: "text",
        key: "quoteMark",
        box: { x: 405, y, w: 270, h: 130 },
        fontSize: 200,
        lineHeight: 170,
        font: "display",
        color: "accent",
        align: "center",
        staticText: "“",
      },
      {
        kind: "text",
        key: "quote",
        box: { x: 140, y: y + 170, w: 800, h: 310 },
        fontSize: scale.lead.fontSize,
        lineHeight: scale.lead.lineHeight,
        weight: 400,
        font: "body",
        color: "titleLight",
        align: "center",
      },
      {
        kind: "text",
        key: "author",
        // Entrelinha própria (48), não a 40 da escala micro — proporção
        // local preserva o literal original e continua escalando junto.
        box: { x: 140, y: y + 500, w: 800, h: 60 },
        fontSize: scale.micro.fontSize,
        lineHeight: lh(scale.micro.fontSize, 48 / 32),
        weight: 400,
        font: "mono",
        color: "accent",
        align: "center",
      },
    ];
  },
};
