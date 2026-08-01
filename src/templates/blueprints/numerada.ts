import type { Blueprint } from "@/core/domain/template/blueprint";
import { anchor } from "@/templates/geometry";

export const numerada: Blueprint = {
  id: "numerada",
  name: "Numerada",
  role: "Item de lista com número gigante acima da manchete.",
  slots: (ctx) => {
    const { margin, scale, variant } = ctx;
    const { top, height } = ctx.band;
    const y = anchor(variant.textBlock, top, height, 555);
    const contentWidth = ctx.canvas.w - 2 * margin;

    return [
      {
        kind: "text",
        key: "number",
        box: { x: 413, y, w: 253, h: 185 },
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
        box: { x: margin, y: y + 225, w: contentWidth, h: 330 },
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
