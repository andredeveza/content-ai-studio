import type { Blueprint } from "@/core/domain/template/blueprint";
import { anchor, shrinkToBand } from "@/templates/geometry";

const GAP_AFTER_HEADING = 40;
const GAP_AFTER_LEAD = 60;
const CTA_H = 120;

export const fecho: Blueprint = {
  id: "fecho",
  name: "Fechamento",
  role: "Chamada final com ação clara e assinatura da marca.",
  slots: (ctx) => {
    const { margin, scale, variant } = ctx;
    const { top, height } = ctx.band;
    const contentWidth = ctx.canvas.w - 2 * margin;

    const [headingH, leadH] = shrinkToBand(
      GAP_AFTER_HEADING + GAP_AFTER_LEAD + CTA_H,
      [
        { lines: 2, lineHeight: scale.display.lineHeight },
        { lines: 2, lineHeight: scale.body.lineHeight },
      ],
      height,
    ) as [number, number];
    const leadY = headingH + GAP_AFTER_HEADING;
    const ctaY = leadY + leadH + GAP_AFTER_LEAD;
    const blockH = ctaY + CTA_H;

    const y = anchor(variant.textBlock, top, height, blockH);

    return [
      {
        kind: "text",
        key: "heading",
        box: { x: margin, y, w: contentWidth, h: headingH },
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
        box: { x: margin, y: y + leadY, w: contentWidth, h: leadH },
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
        // Pílula de CTA: altura fixa de propósito, é um botão.
        box: { x: 290, y: y + ctaY, w: 500, h: CTA_H },
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
