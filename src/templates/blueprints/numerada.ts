import type { Blueprint } from "@/core/domain/template/blueprint";
import { anchor, shrinkToBand } from "@/templates/geometry";

const GAP_AFTER_NUMBER = 40;

export const numerada: Blueprint = {
  id: "numerada",
  name: "Numerada",
  role: "Item de lista com número gigante acima da manchete.",
  slots: (ctx) => {
    const { margin, scale, variant } = ctx;
    const { top, height } = ctx.band;
    const contentWidth = ctx.canvas.w - 2 * margin;

    // O numeral do estilo 05 ("canto escuro") é 180px: sem derivar a
    // caixa da entrelinha, ele não caberia na altura fixa antiga (185).
    const numberH = scale.hero.lineHeight;
    const [headingH] = shrinkToBand(
      numberH + GAP_AFTER_NUMBER,
      [{ lines: 3, lineHeight: scale.heading.lineHeight }],
      height,
    ) as [number];
    const headingY = numberH + GAP_AFTER_NUMBER;
    const blockH = headingY + headingH;

    const y = anchor(variant.textBlock, top, height, blockH);

    return [
      {
        kind: "text",
        key: "number",
        box: { x: 413, y, w: 253, h: numberH },
        fontSize: scale.hero.fontSize,
        lineHeight: scale.hero.lineHeight,
        tracking: scale.hero.tracking,
        font: "display",
        color: "accent",
        align: "center",
      },
      {
        kind: "text",
        key: "heading",
        box: { x: margin, y: y + headingY, w: contentWidth, h: headingH },
        fontSize: scale.heading.fontSize,
        lineHeight: scale.heading.lineHeight,
        tracking: scale.heading.tracking,
        font: "display",
        color: "title",
        align: "center",
      },
    ];
  },
};
