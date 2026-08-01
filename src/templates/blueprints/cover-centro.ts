import type { Blueprint } from "@/core/domain/template/blueprint";
import { anchor, shrinkToBand } from "@/templates/geometry";

const KICKER_H = 60;
const GAP_AFTER_KICKER = 60;
const GAP_AFTER_HEADING = 40;

export const coverCentro: Blueprint = {
  id: "cover-centro",
  name: "Capa centrada",
  role: "Abertura de alto impacto, manchete no eixo central.",
  slots: (ctx) => {
    const { margin, scale, variant } = ctx;
    const { top, height } = ctx.band;
    const contentWidth = ctx.canvas.w - 2 * margin;

    // Alturas derivadas da escala, não literais: um estilo que sobe a
    // display (ex.: 01 "manchete sangrada", 128–148px) precisa da caixa
    // crescendo junto, senão o clamp corta a manchete no meio.
    const [headingH, leadH] = shrinkToBand(
      KICKER_H + GAP_AFTER_KICKER + GAP_AFTER_HEADING,
      [
        { lines: 3, lineHeight: scale.display.lineHeight },
        { lines: 2, lineHeight: scale.body.lineHeight },
      ],
      height,
    ) as [number, number];
    const headingY = KICKER_H + GAP_AFTER_KICKER;
    const leadY = headingY + headingH + GAP_AFTER_HEADING;
    const blockH = leadY + leadH;

    const y = anchor(variant.textBlock, top, height, blockH);

    return [
      {
        kind: "text",
        key: "kicker",
        box: { x: margin, y, w: contentWidth, h: KICKER_H },
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
        box: { x: margin, y: y + headingY, w: contentWidth, h: headingH },
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
    ];
  },
};
