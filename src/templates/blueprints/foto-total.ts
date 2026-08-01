import type { Blueprint } from "@/core/domain/template/blueprint";
import { lh } from "@/core/domain/template/type-scale";

export const fotoTotal: Blueprint = {
  id: "foto-total",
  name: "Foto total",
  role: "Imagem sangrando com manchete ancorada na base.",
  slots: (ctx) => {
    const { margin, scale, canvas } = ctx;
    const { bottom } = ctx.band;
    const headingLh = lh(scale.display.fontSize, 116 / 110);
    const headingH = 2 * headingLh;

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
        // Manchete ancorada na base é a assinatura deste arquétipo — o
        // eixo `textBlock` não se aplica aqui.
        box: { x: margin, y: bottom - headingH, w: 780, h: headingH },
        fontSize: scale.display.fontSize,
        lineHeight: headingLh,
        tracking: scale.display.tracking,
        font: "display",
        color: "title",
        align: "left",
      },
    ];
  },
};
