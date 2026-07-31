import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { analyzeImageBuffer } from "@/core/application/services/image-analysis.service";

type Rgb = readonly [number, number, number];

// Monta um PNG sintético com três faixas horizontais de cor sólida —
// dá pra prever exatamente a luminância de cada faixa sem depender de
// nenhuma imagem real.
async function bandedPng(width: number, height: number, top: Rgb, mid: Rgb, bottom: Rgb): Promise<Buffer> {
  const channels = 3;
  const raw = Buffer.alloc(width * height * channels);

  for (let y = 0; y < height; y += 1) {
    const band = y < height / 3 ? top : y < (2 * height) / 3 ? mid : bottom;
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * channels;
      raw[i] = band[0];
      raw[i + 1] = band[1];
      raw[i + 2] = band[2];
    }
  }

  return sharp(raw, { raw: { width, height, channels } }).png().toBuffer();
}

describe("analyzeImageBuffer (bloco 7) — porte literal de analyzeImage()", () => {
  it("mede luminância crescente do topo pra base numa imagem em três faixas", async () => {
    const buffer = await bandedPng(30, 90, [0, 0, 0], [128, 128, 128], [255, 255, 255]);
    const analysis = await analyzeImageBuffer(buffer);

    expect(analysis.width).toBe(30);
    expect(analysis.height).toBe(90);
    expect(analysis.aspect).toBeCloseTo(30 / 90, 5);

    expect(analysis.luminanceTop).toBeLessThan(0.05);
    expect(analysis.luminanceBottom).toBeGreaterThan(0.95);
    expect(analysis.luminanceMid).toBeGreaterThan(0.35);
    expect(analysis.luminanceMid).toBeLessThan(0.65);
    expect(analysis.luminanceTop).toBeLessThan(analysis.luminanceMid);
    expect(analysis.luminanceMid).toBeLessThan(analysis.luminanceBottom);
  });

  it("identifica a cor dominante (quantização em buckets de 32) numa imagem quase uniforme", async () => {
    const color: Rgb = [20, 40, 210];
    const buffer = await bandedPng(24, 24, color, color, color);
    const analysis = await analyzeImageBuffer(buffer);

    expect(analysis.dominantColor).toMatch(/^#[0-9a-f]{6}$/i);
    // mesmo bucket (>>5) do valor original — a média fica bem próxima
    const r = Number.parseInt(analysis.dominantColor.slice(1, 3), 16);
    const g = Number.parseInt(analysis.dominantColor.slice(3, 5), 16);
    const b = Number.parseInt(analysis.dominantColor.slice(5, 7), 16);
    expect(Math.abs(r - color[0])).toBeLessThanOrEqual(31);
    expect(Math.abs(g - color[1])).toBeLessThanOrEqual(31);
    expect(Math.abs(b - color[2])).toBeLessThanOrEqual(31);
  });
});
