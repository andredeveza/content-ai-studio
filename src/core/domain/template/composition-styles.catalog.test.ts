import { describe, expect, it } from "vitest";
import { COMPOSITION_STYLES, getCompositionStyle, STYLE_SLUGS } from "@/core/domain/template/composition-styles.catalog";
import { REQUIRED_SLIDE_ROLES, SLIDE_ROLES } from "@/core/domain/template/slide-role";
import { ALL_ARCHETYPE_IDS } from "@/templates/blueprints";

// O README trata o catálogo como DADO ("acrescentar o oitavo é inserir
// uma linha, nenhum componente muda"). Como ele mora em TS e não numa
// tabela, estas invariantes fazem o papel das constraints que o banco
// daria — é o que mantém o desvio honesto.
describe("catálogo de estilos de composição", () => {
  it("tem os 8 estilos do README", () => {
    expect(COMPOSITION_STYLES).toHaveLength(8);
  });

  it("slug e id são únicos", () => {
    expect(new Set(STYLE_SLUGS).size).toBe(8);
    expect(new Set(COMPOSITION_STYLES.map((s) => s.id)).size).toBe(8);
  });

  it("exatamente um estilo é 'single' (o 08, capa de campanha)", () => {
    const singles = COMPOSITION_STYLES.filter((s) => s.format === "single");
    expect(singles.map((s) => s.slug)).toEqual(["capa-de-campanha"]);
  });

  it.each(COMPOSITION_STYLES.map((s) => [s.slug, s] as const))(
    "%s cobre os papéis obrigatórios e só referencia arquétipos existentes",
    (_slug, style) => {
      for (const role of REQUIRED_SLIDE_ROLES) {
        expect(style.slideRecipes[role], `falta receita para "${role}"`).toBeDefined();
      }
      for (const [role, recipe] of Object.entries(style.slideRecipes)) {
        expect(SLIDE_ROLES).toContain(role);
        expect(ALL_ARCHETYPE_IDS).toContain(recipe.archetypeId);
        // Um eixo vazio faria `resolveVariant` cair no fallback e o
        // estilo perderia a própria assinatura sem ninguém perceber.
        for (const values of Object.values(recipe.axes)) {
          expect(values.length).toBeGreaterThan(0);
        }
      }
    },
  );

  it.each(COMPOSITION_STYLES.map((s) => [s.slug, s] as const))("%s tem geometria plausível", (_slug, style) => {
    expect(style.margin).toBeGreaterThan(0);
    expect(style.margin).toBeLessThan(200);
    expect(style.bandRule.top).toBeGreaterThan(0);
    expect(style.bandRule.bottomInset).toBeGreaterThan(0);
    for (const [role, step] of Object.entries(style.typeScale)) {
      expect(step.min, `${role}.min`).toBeGreaterThan(0);
      expect(step.max, `${role}.max`).toBeGreaterThanOrEqual(step.min);
      expect(step.lineHeightRatio, `${role}.lineHeightRatio`).toBeGreaterThan(0);
    }
  });

  // README: "Sem foto boa indexada, os estilos 01, 03 e 05 aparecem
  // desabilitados com o motivo à mostra."
  it("exatamente os estilos 01, 03 e 05 exigem foto", () => {
    const comFoto = COMPOSITION_STYLES.filter((s) => s.requires.some((r) => r.kind === "image")).map((s) => s.slug);
    expect(comFoto.sort()).toEqual(["canto-escuro", "manchete-sangrada", "revista-autoral"]);
  });

  // "fundo noturno fixo" — o modo do 02 não pode ser distribuído.
  it("noite-futurista fixa o modo escuro em todos os papéis", () => {
    const style = getCompositionStyle("noite-futurista");
    const recipes = Object.values(style.slideRecipes);
    expect(recipes.length).toBeGreaterThan(0);
    expect(recipes.every((r) => r.mode === "dark")).toBe(true);
  });

  it("getCompositionStyle explode em slug desconhecido", () => {
    expect(() => getCompositionStyle("nao-existe")).toThrow(/desconhecido/);
  });
});
