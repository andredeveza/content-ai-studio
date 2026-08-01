import { afterAll, describe, expect, it } from "vitest";
import { PuppeteerRenderer } from "@/infra/render/puppeteer-renderer";
import { TemplateEngineService } from "@/core/application/services/template-engine.service";
import { ALL_ARCHETYPE_IDS, getBlueprint } from "@/templates/blueprints";
import { blueprintContext } from "@/templates/context";
import type { BrandKit } from "@/core/domain/brandkit/brand-kit";
import type { SlideContent } from "@/core/domain/template/slide-content";

// Lê width/height do chunk IHDR (bytes 16..24) — evita depender de uma
// lib de imagem só para confirmar que o PNG saiu do tamanho certo.
function readPngDimensions(png: Buffer): { width: number; height: number } {
  const magic = png.subarray(0, 8).toString("hex");
  expect(magic).toBe("89504e470d0a1a0a");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

const brandKit: BrandKit = {
  id: "brandkit-1",
  clientId: "client-1",
  palette: {
    ink: "#06070A",
    graphite: "#101319",
    slate: "#1B212B",
    gray: "#8B94A3",
    title: "#EEF1F6",
    brand: "#0A47A8",
    primary: "#1C7ED6",
    accent: "#57A8FF",
    loud: "#1C4FE0",
    bgLight: "#FFFFFF",
    panelLight: "#F4F6FA",
    titleLight: "#0A0C10",
    textLight: "#5A6474",
  },
  gradient: "linear-gradient(135deg, #0A47A8, #1C7ED6 55%, #57A8FF)",
  fonts: {
    display: { family: "Arial", weights: [700, 900] },
    body: { family: "Arial", weights: [400, 500] },
    mono: { family: "Courier New", weights: [400, 500] },
  },
  logo: { path: null, radius: 0 },
  chrome: { top: ["@trafegodigitalad", "AD TRÁFEGO DIGITAL", "©2026"], footer: "arraste", footerLast: "salve" },
  rules: { neonMaxArea: "detail", alternateModes: true, blurTextForbidden: true },
  imageStyle: null,
  cta: "Fale com a gente",
  style: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function buildContent(archetypeId: (typeof ALL_ARCHETYPE_IDS)[number], canvas: { w: number; h: number }): SlideContent {
  const slots = getBlueprint(archetypeId).slots(blueprintContext(canvas));
  const texts: Record<string, string> = {};
  for (const slot of slots) {
    if (slot.kind === "text" && !slot.staticText) texts[slot.key] = `Conteúdo de teste do slot ${slot.key}`;
  }
  return { texts };
}

describe("PuppeteerRenderer (bloco 5) — screenshot real via Chromium headless", () => {
  const renderer = new PuppeteerRenderer();
  const engine = new TemplateEngineService();

  afterAll(async () => {
    await renderer.close();
  });

  it("produz um PNG 1080×1350 de verdade para a capa (cover-centro)", async () => {
    const canvas = { w: 1080, h: 1350 };
    const html = engine.render(getBlueprint("cover-centro"), canvas, buildContent("cover-centro", canvas), brandKit);

    const { png } = await renderer.screenshot({ html, width: canvas.w, height: canvas.h });

    expect(png.length).toBeGreaterThan(1000);
    const { width, height } = readPngDimensions(png);
    expect(width).toBe(1080);
    expect(height).toBe(1350);
  }, 30_000);

  it("produz um PNG 1080×1080 de verdade (proporção 1:1)", async () => {
    const canvas = { w: 1080, h: 1080 };
    const html = engine.render(getBlueprint("fecho"), canvas, buildContent("fecho", canvas), brandKit, {
      isLastSlide: true,
    });

    const { png } = await renderer.screenshot({ html, width: canvas.w, height: canvas.h });
    const { width, height } = readPngDimensions(png);
    expect(width).toBe(1080);
    expect(height).toBe(1080);
  }, 30_000);

  it("renderiza os 8 arquétipos sem lançar exceção", async () => {
    const canvas = { w: 1080, h: 1350 };
    for (const id of ALL_ARCHETYPE_IDS) {
      const html = engine.render(getBlueprint(id), canvas, buildContent(id, canvas), brandKit);
      const { png } = await renderer.screenshot({ html, width: canvas.w, height: canvas.h });
      const { width, height } = readPngDimensions(png);
      expect(width).toBe(1080);
      expect(height).toBe(1350);
    }
  }, 120_000);
});
