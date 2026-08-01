import { describe, expect, it } from "vitest";
import { ALL_ARCHETYPE_IDS, getBlueprint } from "@/templates/blueprints";
import { blueprintContext } from "@/templates/context";
import { canvasForRatio } from "@/core/domain/project/project";
import type { ProjectRatio } from "@/core/domain/project/project";

// Rede de segurança do refactor que introduziu `BlueprintContext`
// (plano, passo A1). Este teste foi escrito ANTES da mudança de
// assinatura de `Blueprint.slots`, capturando a geometria literal que os
// 8 arquétipos produziam com os valores default (MARGIN 80, banda
// 200..H-230, escala base do README).
//
// Regra: com o contexto default, a saída tem que continuar IDÊNTICA para
// sempre. Se um estilo de composição mudar margem/escala, ele passa um
// contexto diferente — nunca altera o default. Um diff aqui significa
// que a geometria hifi regrediu (README, "Fidelity": "se um valor é
// 90/110px ou 1246px, é esse valor").
const RATIOS: readonly ProjectRatio[] = ["4:5", "1:1", "9:16"];

describe("geometria default dos 8 arquétipos (golden)", () => {
  for (const ratio of RATIOS) {
    for (const id of ALL_ARCHETYPE_IDS) {
      it(`${id} @ ${ratio} não muda com o contexto default`, () => {
        const canvas = canvasForRatio(ratio);
        const slots = getBlueprint(id).slots(blueprintContext(canvas));
        expect(slots).toMatchSnapshot();
      });
    }
  }
});
