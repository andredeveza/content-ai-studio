import { describe, expect, it } from "vitest";
import { COMPOSITION_STYLES } from "@/core/domain/template/composition-styles.catalog";
import { ALL_ARCHETYPE_IDS } from "@/templates/blueprints";
import { FULL_AXES } from "@/core/domain/template/variant";
import { resolveScale } from "@/core/domain/template/type-scale";
import type { LayoutVariant, VariantAxisConstraints } from "@/core/domain/template/variant";
import { getBlueprint } from "@/templates/blueprints";
import type { ArchetypeId } from "@/core/domain/template/blueprint";
import { blueprintContext } from "@/templates/context";
import { band } from "@/templates/geometry";
import { computeClamp } from "@/templates/clamp";

// Generaliza o teste que o README exige no bloco 4 ("renderize os 8 com
// textos de comprimento absurdo e confirme que nada invade o chrome")
// para a matriz inteira: estilo × papel × variante × formato. É o que
// permite acrescentar um nono estilo sem medo — se ele violar a faixa de
// conteúdo ou a regra de clamp, este teste aponta exatamente onde.
const CANVASES = [
  { label: "4:5", w: 1080, h: 1350 },
  { label: "1:1", w: 1080, h: 1080 },
  { label: "9:16", w: 1080, h: 1920 },
];

function axisProduct(axes: VariantAxisConstraints): Omit<LayoutVariant, "mode">[] {
  const out: Omit<LayoutVariant, "mode">[] = [];
  for (const textBlock of axes.textBlock) {
    for (const align of axes.align) {
      for (const scaleStep of axes.scaleStep) {
        for (const logo of axes.logo) {
          for (const footer of axes.footer) {
            out.push({ textBlock, align, scaleStep, logo, footer });
          }
        }
      }
    }
  }
  return out;
}

// Mídia sangrada e véu cobrem o canvas inteiro de propósito (passam por
// baixo do chrome) — a faixa de conteúdo não se aplica a eles.
const BLEEDS_BY_DESIGN = new Set(["media", "scrim"]);

describe("matriz de geometria: estilo × papel × variante × formato", () => {
  for (const style of COMPOSITION_STYLES) {
    for (const [role, recipe] of Object.entries(style.slideRecipes)) {
      it(`${style.slug} / ${role} respeita a faixa e a regra de clamp em toda variante`, () => {
        const blueprint = getBlueprint(recipe.archetypeId);

        for (const canvas of CANVASES) {
          const contentBand = band(canvas.h, style.bandRule);

          for (const partial of axisProduct(recipe.axes)) {
            const variant: LayoutVariant = { ...partial, mode: recipe.mode ?? "light" };
            const ctx = blueprintContext(canvas, {
              margin: style.margin,
              bandRule: style.bandRule,
              scale: resolveScale(style.typeScale, variant.scaleStep),
              variant,
            });

            const where = `${style.slug}/${role}/${canvas.label}/${JSON.stringify(partial)}`;

            for (const slot of blueprint.slots(ctx)) {
              if (BLEEDS_BY_DESIGN.has(slot.kind)) continue;

              expect(slot.box.y, `${where} slot="${slot.key}" começa antes da faixa`).toBeGreaterThanOrEqual(
                contentBand.top,
              );
              expect(
                slot.box.y + slot.box.h,
                `${where} slot="${slot.key}" invade o chrome inferior`,
              ).toBeLessThanOrEqual(contentBand.bottom);

              expect(slot.box.x, `${where} slot="${slot.key}" sai pela esquerda`).toBeGreaterThanOrEqual(0);
              expect(
                slot.box.x + slot.box.w,
                `${where} slot="${slot.key}" sai pela direita`,
              ).toBeLessThanOrEqual(canvas.w);

              if (slot.kind !== "text") continue;

              // Regra de clamp obrigatória: sempre pelo menos uma linha
              // visível, e o teto nunca maior que a própria caixa.
              const { maxLines, maxHeightPx } = computeClamp(slot.box.h, slot.lineHeight, slot.maxLinesOverride);
              expect(maxLines, `${where} slot="${slot.key}" sem linha visível`).toBeGreaterThanOrEqual(1);
              expect(maxHeightPx, `${where} slot="${slot.key}" clamp maior que a caixa`).toBeLessThanOrEqual(
                slot.box.h,
              );
            }
          }
        }
      });
    }
  }
});

// Blindagem contra edição futura do catálogo: mesmo que alguém aponte um
// papel para outro arquétipo ou abra todos os eixos de uma receita, a
// escala do estilo tem que continuar cabendo na faixa. Sem isto, subir a
// escala de um estilo quebraria silenciosamente um arquétipo que aquele
// estilo hoje não usa.
describe("blindagem: qualquer estilo × qualquer arquétipo × todos os eixos", () => {
  for (const style of COMPOSITION_STYLES) {
    it(`${style.slug} cabe na faixa em todos os 8 arquétipos`, () => {
      for (const id of ALL_ARCHETYPE_IDS as readonly ArchetypeId[]) {
        const blueprint = getBlueprint(id);

        for (const canvas of CANVASES) {
          const contentBand = band(canvas.h, style.bandRule);

          for (const partial of axisProduct(FULL_AXES)) {
            const variant: LayoutVariant = { ...partial, mode: "light" };
            const ctx = blueprintContext(canvas, {
              margin: style.margin,
              bandRule: style.bandRule,
              scale: resolveScale(style.typeScale, variant.scaleStep),
              variant,
            });

            const where = `${style.slug}/${id}/${canvas.label}/${partial.textBlock}/${partial.scaleStep}`;

            for (const slot of blueprint.slots(ctx)) {
              if (BLEEDS_BY_DESIGN.has(slot.kind)) continue;
              expect(slot.box.y, `${where} slot="${slot.key}" antes da faixa`).toBeGreaterThanOrEqual(contentBand.top);
              expect(
                slot.box.y + slot.box.h,
                `${where} slot="${slot.key}" invade o chrome inferior`,
              ).toBeLessThanOrEqual(contentBand.bottom);
            }
          }
        }
      }
    });
  }
});
