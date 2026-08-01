import type { Blueprint } from "@/core/domain/template/blueprint";
import { lh } from "@/core/domain/template/type-scale";

export const dado: Blueprint = {
  id: "dado",
  name: "Dado",
  role: "Manchete no topo e área de gráfico ocupando o corpo.",
  slots: (ctx) => {
    const { margin, scale, canvas } = ctx;
    const { top, bottom } = ctx.band;
    const chartTop = top + 250;
    const chartHeight = bottom - chartTop;
    const base = chartTop + chartHeight - 40;

    const bar = (key: string, x: number, fraction: number, color: "accent" | "primary") => ({
      kind: "chart-bar" as const,
      key,
      box: { x, y: base - chartHeight * fraction, w: 120, h: chartHeight * fraction },
      color,
      radius: 10,
    });

    return [
      {
        kind: "text",
        key: "heading",
        // Manchete fixa no topo da faixa: o corpo é do gráfico.
        box: { x: 199, y: top, w: canvas.w - 2 * margin - 198, h: 210 },
        fontSize: scale.heading.fontSize,
        lineHeight: lh(scale.heading.fontSize, 100 / 90),
        tracking: scale.heading.tracking,
        font: "display",
        color: "title",
        align: "center",
      },
      {
        kind: "shape",
        key: "chartCard",
        box: { x: 116, y: chartTop, w: 848, h: chartHeight },
        color: "panelLight",
        radius: 16,
      },
      bar("bar1", 160, 0.42, "accent"),
      bar("bar2", 310, 0.62, "accent"),
      bar("bar3", 460, 0.26, "primary"),
      bar("bar4", 610, 0.5, "primary"),
    ];
  },
};
