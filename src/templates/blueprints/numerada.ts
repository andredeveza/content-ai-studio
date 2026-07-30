import type { Blueprint } from "@/core/domain/template/blueprint";
import { band, mid, MARGIN } from "@/templates/geometry";

export const numerada: Blueprint = {
  id: "numerada",
  name: "Numerada",
  role: "Item de lista com número gigante acima da manchete.",
  slots: (canvas) => {
    const { top, height } = band(canvas.h);
    const y = mid(top, height, 555);
    const contentWidth = canvas.w - 2 * MARGIN;

    return [
      {
        kind: "text",
        key: "number",
        box: { x: 413, y, w: 253, h: 185 },
        fontSize: 175,
        lineHeight: 185,
        tracking: "-0.04em",
        font: "display",
        color: "accent",
        align: "center",
      },
      {
        kind: "text",
        key: "heading",
        box: { x: MARGIN, y: y + 225, w: contentWidth, h: 330 },
        fontSize: 90,
        lineHeight: 110,
        tracking: "-0.02em",
        font: "display",
        color: "title",
        align: "center",
      },
    ];
  },
};
