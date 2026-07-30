import type { Blueprint } from "@/core/domain/template/blueprint";
import { band, mid, MARGIN } from "@/templates/geometry";

export const citacao: Blueprint = {
  id: "citacao",
  name: "Citação",
  role: "Cartão translúcido sobre foto, com marca de aspas.",
  slots: (canvas) => {
    const { top, bottom, height } = band(canvas.h);
    const y = mid(top, height, 560);
    const cardWidth = canvas.w - 2 * MARGIN - 1;

    return [
      { kind: "media", key: "media", box: { x: 0, y: 0, w: canvas.w, h: canvas.h }, bleed: true },
      {
        kind: "shape",
        key: "card",
        box: { x: MARGIN, y: top, w: cardWidth, h: bottom - top },
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
        fontSize: 48,
        lineHeight: 62,
        weight: 400,
        font: "body",
        color: "titleLight",
        align: "center",
      },
      {
        kind: "text",
        key: "author",
        box: { x: 140, y: y + 500, w: 800, h: 60 },
        fontSize: 32,
        lineHeight: 48,
        weight: 400,
        font: "mono",
        color: "accent",
        align: "center",
      },
    ];
  },
};
