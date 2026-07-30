import { describe, expect, it } from "vitest";
import { ALL_ARCHETYPE_IDS, getBlueprint } from "@/templates/blueprints";
import { band, CHROME_TOP_BAND, chromeBottomBand } from "@/templates/geometry";

const CANVAS_HEIGHTS = [1350, 1080];
const CANVAS_WIDTH = 1080;

describe("Geometria dos 8 arquétipos (bloco 4)", () => {
  it("a faixa de conteúdo nunca invade as faixas reservadas ao chrome", () => {
    for (const h of CANVAS_HEIGHTS) {
      const contentBand = band(h);
      const bottomChrome = chromeBottomBand(h);
      expect(contentBand.top).toBeGreaterThanOrEqual(CHROME_TOP_BAND.y + CHROME_TOP_BAND.height);
      expect(contentBand.bottom).toBeLessThanOrEqual(bottomChrome.y);
    }
  });

  for (const id of ALL_ARCHETYPE_IDS) {
    it(`"${id}" mantém todo slot de conteúdo (não full-bleed) dentro da faixa segura`, () => {
      for (const h of CANVAS_HEIGHTS) {
        const canvas = { w: CANVAS_WIDTH, h };
        const contentBand = band(h);
        const slots = getBlueprint(id).slots(canvas);

        expect(slots.length).toBeGreaterThan(0);

        for (const slot of slots) {
          const isFullBleedMedia =
            (slot.kind === "media" && slot.bleed) || slot.kind === "scrim";
          if (isFullBleedMedia) continue;

          expect(slot.box.y).toBeGreaterThanOrEqual(contentBand.top);
          expect(slot.box.y + slot.box.h).toBeLessThanOrEqual(contentBand.bottom);
          expect(slot.box.x).toBeGreaterThanOrEqual(0);
          expect(slot.box.x + slot.box.w).toBeLessThanOrEqual(canvas.w);
        }
      }
    });
  }

  it("todos os 8 arquétipos do README estão presentes", () => {
    expect([...ALL_ARCHETYPE_IDS].sort()).toEqual(
      [
        "cover-centro",
        "numerada",
        "citacao",
        "dado",
        "foto-total",
        "lista-icone",
        "evento",
        "fecho",
      ].sort(),
    );
  });
});
