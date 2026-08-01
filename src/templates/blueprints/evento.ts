import type { Blueprint } from "@/core/domain/template/blueprint";
import { lh } from "@/core/domain/template/type-scale";
import { anchor, shrinkToBand } from "@/templates/geometry";

const BADGE = 260;
const GAP_AFTER_BADGE = 50;
const GAP_AFTER_HEADING = 30;

export const evento: Blueprint = {
  id: "evento",
  name: "Evento",
  role: "Bloco de data destacado com título e detalhe.",
  slots: (ctx) => {
    const { margin, scale, variant, canvas } = ctx;
    const { top, height } = ctx.band;
    const contentWidth = canvas.w - 2 * margin;

    const headingLh = lh(scale.heading.fontSize, 104 / 90);
    const detailLh = lh(scale.body.fontSize, 48 / 36);
    const [headingH, detailH] = shrinkToBand(
      BADGE + GAP_AFTER_BADGE + GAP_AFTER_HEADING,
      [
        { lines: 2, lineHeight: headingLh },
        { lines: 2, lineHeight: detailLh },
      ],
      height,
    ) as [number, number];
    const headingY = BADGE + GAP_AFTER_BADGE;
    const detailY = headingY + headingH + GAP_AFTER_HEADING;
    const blockH = detailY + detailH;

    const y = anchor(variant.textBlock, top, height, blockH);

    return [
      {
        kind: "shape",
        key: "dateBadge",
        box: { x: margin, y, w: BADGE, h: BADGE },
        color: "accent",
        radius: 30,
      },
      {
        kind: "text",
        key: "day",
        box: { x: margin, y: y + 42, w: BADGE, h: 130 },
        fontSize: 120,
        lineHeight: 126,
        font: "display",
        color: "title",
        align: "center",
      },
      {
        kind: "text",
        key: "month",
        box: { x: margin, y: y + 178, w: BADGE, h: 50 },
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
        box: { x: margin, y: y + headingY, w: contentWidth, h: headingH },
        fontSize: scale.heading.fontSize,
        lineHeight: headingLh,
        tracking: scale.heading.tracking,
        font: "display",
        color: "title",
      },
      {
        kind: "text",
        key: "detail",
        box: { x: margin, y: y + detailY, w: 780, h: detailH },
        fontSize: scale.body.fontSize,
        lineHeight: detailLh,
        weight: 400,
        font: "body",
        color: "textLight",
      },
    ];
  },
};
