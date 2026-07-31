// Porte quase literal de `analyzeImage()` em
// design/Acervo Inteligente.dc.html (um dos dois protótipos que o
// README trata como especificação executável) — troca `canvas`/
// `getImageData` do navegador por `sharp` no servidor. A grade de
// amostragem (72×90) e a fórmula de luminância/quantização são as
// mesmas; só a fonte dos pixels muda.

const SAMPLE_WIDTH = 72;
const SAMPLE_HEIGHT = 90;

export interface ImageAnalysis {
  readonly width: number;
  readonly height: number;
  readonly aspect: number;
  readonly dominantColor: string;
  readonly luminanceTop: number;
  readonly luminanceMid: number;
  readonly luminanceBottom: number;
}

function toHex(value: number): string {
  const clamped = Math.max(0, Math.min(255, Math.round(value)));
  const hex = clamped.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

export async function analyzeImageBuffer(buffer: Buffer): Promise<ImageAnalysis> {
  // Import dinâmico de propósito: mesma razão do `pdf-parse` em
  // pdf-extraction.service.ts — um binário nativo (`sharp`) estático no
  // topo do arquivo entra no grafo de módulos do Server Component que
  // importa (mesmo transitivo, via server action bindada) e quebra a
  // build com "Object.defineProperty called on non-object" (só
  // descoberto rodando de verdade — ver PROGRESSO.md).
  const { default: sharp } = await import("sharp");
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  // Amostra esticada pra grade fixa (igual ao ctx.drawImage do
  // protótipo) — só serve pra ler cor/luminância, não representa a
  // proporção real (essa vem de width/height acima).
  const { data, info } = await sharp(buffer)
    .resize(SAMPLE_WIDTH, SAMPLE_HEIGHT, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  const lum = [0, 0, 0];
  const count = [0, 0, 0];

  for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
    const band = y < SAMPLE_HEIGHT / 3 ? 0 : y < (2 * SAMPLE_HEIGHT) / 3 ? 1 : 2;
    for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
      const i = (y * SAMPLE_WIDTH + x) * channels;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;

      lum[band]! += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      count[band]! += 1;

      const key = `${r >> 5},${g >> 5},${b >> 5}`;
      const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
      bucket.n += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      buckets.set(key, bucket);
    }
  }

  let best: { n: number; r: number; g: number; b: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.n > best.n) best = bucket;
  }
  const dominantColor = best
    ? `#${toHex(best.r / best.n)}${toHex(best.g / best.n)}${toHex(best.b / best.n)}`
    : "#000000";

  return {
    width,
    height,
    aspect: height > 0 ? width / height : 0,
    dominantColor,
    luminanceTop: lum[0]! / count[0]!,
    luminanceMid: lum[1]! / count[1]!,
    luminanceBottom: lum[2]! / count[2]!,
  };
}
