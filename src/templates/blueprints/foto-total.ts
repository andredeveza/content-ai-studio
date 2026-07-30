import type { Blueprint } from "@/core/domain/template/blueprint";
import { band, MARGIN } from "@/templates/geometry";

export const fotoTotal: Blueprint = {
  id: "foto-total",
  name: "Foto total",
  role: "Imagem sangrando com manchete ancorada na base.",
  slots: (canvas) => {
    const { bottom } = band(canvas.h);

    return [
      { kind: "media", key: "media", box: { x: 0, y: 0, w: canvas.w, h: canvas.h }, bleed: true },
      {
        kind: "scrim",
        key: "scrim",
        box: { x: 0, y: canvas.h * 0.45, w: canvas.w, h: canvas.h * 0.55 },
        toColor: "ink",
        toOpacity: 0.92,
      },
      {
        kind: "text",
        key: "heading",
        box: { x: MARGIN, y: bottom - 232, w: 780, h: 232 },
        fontSize: 110,
        lineHeight: 116,
        tracking: "-0.03em",
        font: "display",
        color: "title",
        align: "left",
      },
    ];
  },
};
