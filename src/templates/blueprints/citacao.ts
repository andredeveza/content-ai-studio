import type { Blueprint } from "@/core/domain/template/blueprint";
import { lh } from "@/core/domain/template/type-scale";
import { anchor, shrinkToBand } from "@/templates/geometry";

const QUOTE_MARK_H = 130;
const GAP_AFTER_MARK = 40;
const GAP_AFTER_QUOTE = 20;
const AUTHOR_H = 60;

export const citacao: Blueprint = {
  id: "citacao",
  name: "Citação",
  role: "Cartão translúcido sobre foto, com marca de aspas.",
  slots: (ctx) => {
    const { margin, scale, variant, canvas } = ctx;
    const { top, bottom, height } = ctx.band;
    const cardWidth = canvas.w - 2 * margin - 1;

    const [quoteH] = shrinkToBand(
      QUOTE_MARK_H + GAP_AFTER_MARK + GAP_AFTER_QUOTE + AUTHOR_H,
      [{ lines: 5, lineHeight: scale.lead.lineHeight }],
      height,
    ) as [number];
    const quoteY = QUOTE_MARK_H + GAP_AFTER_MARK;
    const authorY = quoteY + quoteH + GAP_AFTER_QUOTE;
    const blockH = authorY + AUTHOR_H;

    const y = anchor(variant.textBlock, top, height, blockH);

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
        // Glifo decorativo: caixa fixa de propósito, não segue a escala.
        box: { x: 405, y, w: 270, h: QUOTE_MARK_H },
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
        box: { x: 140, y: y + quoteY, w: 800, h: quoteH },
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
        // Entrelinha própria (48 no default), não a 40 da escala micro.
        box: { x: 140, y: y + authorY, w: 800, h: AUTHOR_H },
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
