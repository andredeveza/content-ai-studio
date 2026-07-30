import type { Blueprint } from "@/core/domain/template/blueprint";
import { band, mid, MARGIN } from "@/templates/geometry";

export const coverCentro: Blueprint = {
  id: "cover-centro",
  name: "Capa centrada",
  role: "Abertura de alto impacto, manchete no eixo central.",
  slots: (canvas) => {
    const { top, height } = band(canvas.h);
    const y = mid(top, height, 602);
    const contentWidth = canvas.w - 2 * MARGIN;

    return [
      {
        kind: "text",
        key: "kicker",
        box: { x: MARGIN, y, w: contentWidth, h: 60 },
        fontSize: 32,
        lineHeight: 40,
        tracking: "0.14em",
        weight: 600,
        font: "mono",
        color: "accent",
        align: "center",
      },
      {
        kind: "text",
        key: "heading",
        box: { x: MARGIN, y: y + 120, w: contentWidth, h: 354 },
        fontSize: 110,
        lineHeight: 118,
        tracking: "-0.03em",
        font: "display",
        color: "title",
        align: "center",
      },
      {
        kind: "text",
        key: "lead",
        box: { x: MARGIN, y: y + 514, w: contentWidth, h: 88 },
        fontSize: 36,
        lineHeight: 44,
        weight: 400,
        font: "body",
        color: "textLight",
        align: "center",
      },
    ];
  },
};
