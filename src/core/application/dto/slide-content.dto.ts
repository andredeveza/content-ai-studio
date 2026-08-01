import { z } from "zod";
import type { ArchetypeId } from "@/core/domain/template/blueprint";
import { getBlueprint } from "@/templates/blueprints";
import { blueprintContext } from "@/templates/context";

// Canvas de referência só para descobrir as chaves de slot — elas não
// mudam com H (a geometria reflui, as chaves não).
const REFERENCE_CANVAS = { w: 1080, h: 1350 };

// Constrói o schema de validação de `SlideContent` a partir da própria
// geometria do blueprint (regra não negociável nº4: toda resposta de IA
// passa por Zod antes de tocar o domínio) — evita manter uma lista de
// chaves duplicada e fora de sincronia com `templates/blueprints/*.ts`.
export function buildSlideContentSchema(archetypeId: ArchetypeId) {
  // Contexto default basta: as CHAVES de slot não mudam com estilo nem
  // variante — só a geometria muda.
  const slots = getBlueprint(archetypeId).slots(blueprintContext(REFERENCE_CANVAS));

  const textKeys = slots
    .filter((slot) => slot.kind === "text" && !slot.staticText)
    .map((slot) => slot.key);
  const mediaKeys = slots.filter((slot) => slot.kind === "media").map((slot) => slot.key);

  const textsShape = Object.fromEntries(textKeys.map((key) => [key, z.string().trim().min(1)]));
  const mediaShape = Object.fromEntries(mediaKeys.map((key) => [key, z.string().url()]));

  return z.object({
    texts: z.object(textsShape),
    // Sempre opcional: mídia costuma chegar em outra etapa do pipeline
    // (RetrieveAssets/ImageService) depois do texto — render() já tolera
    // slot de mídia ausente com um fundo neutro.
    media: z.object(mediaShape).optional(),
  });
}

export type SlideContentInput = z.infer<ReturnType<typeof buildSlideContentSchema>>;
