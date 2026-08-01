import { describe, expect, it } from "vitest";
import {
  distributeModes,
  FULL_AXES,
  resolveVariant,
  type SlideMode,
  type VariantAxisConstraints,
} from "@/core/domain/template/variant";

describe("resolveVariant — determinístico e dentro dos eixos permitidos", () => {
  it("mesma semente devolve exatamente a mesma variante", () => {
    const a = resolveVariant(FULL_AXES, "projeto-1:3");
    const b = resolveVariant(FULL_AXES, "projeto-1:3");
    expect(a).toEqual(b);
  });

  // Sem isto o preview do editor e o PNG do Puppeteer podem divergir, e
  // regerar um projeto mudaria o layout debaixo do usuário.
  it("sementes diferentes variam de verdade ao longo do carrossel", () => {
    const variants = Array.from({ length: 8 }, (_, i) => resolveVariant(FULL_AXES, `projeto-1:${i}`));
    const distinct = new Set(variants.map((v) => JSON.stringify(v)));
    expect(distinct.size).toBeGreaterThan(1);
  });

  it("nunca produz valor fora do eixo declarado pelo estilo", () => {
    const narrow: VariantAxisConstraints = {
      textBlock: ["bottom"],
      align: ["left"],
      scaleStep: ["up"],
      logo: ["bottom"],
      footer: ["pill"],
    };
    for (let i = 0; i < 50; i += 1) {
      const variant = resolveVariant(narrow, `seed-${i}`);
      expect(variant).toEqual({
        textBlock: "bottom",
        align: "left",
        scaleStep: "up",
        logo: "bottom",
        footer: "pill",
      });
    }
  });
});

// README, "Brand Kit": "o feed alterna claro e escuro de propósito — o
// seletor de layout deve DISTRIBUIR modos, não sortear."
describe("distributeModes — distribui, não sorteia", () => {
  const none = (n: number) => Array.from({ length: n }, () => undefined);

  it.each([6, 7, 8])("capa e fecho ficam no mesmo modo (%i slides)", (count) => {
    for (let s = 0; s < 20; s += 1) {
      const modes = distributeModes(count, none(count), `projeto-${s}`);
      expect(modes[0]).toBe(modes[count - 1]);
    }
  });

  it.each([6, 7, 8])("nunca deixa 3 iguais seguidos (%i slides)", (count) => {
    for (let s = 0; s < 20; s += 1) {
      const modes = distributeModes(count, none(count), `projeto-${s}`);
      for (let i = 2; i < modes.length; i += 1) {
        const run = modes[i] === modes[i - 1] && modes[i - 1] === modes[i - 2];
        expect(run, `corrida de 3 em ${modes.join(",")}`).toBe(false);
      }
    }
  });

  it.each([6, 7, 8])("usa os dois modos, nunca um feed monocromático (%i slides)", (count) => {
    for (let s = 0; s < 20; s += 1) {
      const modes = distributeModes(count, none(count), `projeto-${s}`);
      expect(new Set(modes).size).toBe(2);
    }
  });

  it("respeita o modo fixado pela receita do estilo", () => {
    // Estilo 02 "noite futurista": fundo noturno fixo, todo slide dark.
    const fixed: (SlideMode | undefined)[] = Array.from({ length: 7 }, () => "dark");
    expect(distributeModes(7, fixed, "projeto-x")).toEqual(Array.from({ length: 7 }, () => "dark"));
  });

  it("é determinístico para a mesma semente", () => {
    expect(distributeModes(7, none(7), "projeto-y")).toEqual(distributeModes(7, none(7), "projeto-y"));
  });
});
