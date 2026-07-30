import type { GenericSlideCopy } from "@/core/application/dto/copy.dto";
import type { ArchetypeId } from "@/core/domain/template/blueprint";
import type { SlideContent } from "@/core/domain/template/slide-content";

// Traduz o envelope genérico do CopyService para as chaves exatas de
// slot que cada arquétipo espera (block4/templates/blueprints/*.ts) —
// roda depois que o SelectLayout já escolheu o arquétipo a partir de
// `copy.body`.
export function mapGenericCopyToSlideContent(archetypeId: ArchetypeId, copy: GenericSlideCopy): SlideContent {
  switch (archetypeId) {
    case "cover-centro":
      return { texts: { kicker: copy.kicker, heading: copy.heading, lead: copy.lead } };
    case "numerada":
      return { texts: { number: copy.number, heading: copy.heading } };
    case "citacao":
      return { texts: { quote: copy.quote || copy.body, author: copy.author } };
    case "dado":
      return { texts: { heading: copy.heading } };
    case "foto-total":
      return { texts: { heading: copy.heading } };
    case "lista-icone":
      return {
        texts: {
          heading: copy.heading,
          item1: copy.items[0] ?? "",
          item2: copy.items[1] ?? "",
          item3: copy.items[2] ?? "",
        },
      };
    case "evento":
      return { texts: { day: copy.day, month: copy.month, heading: copy.heading, detail: copy.detail } };
    case "fecho":
      return { texts: { heading: copy.heading, lead: copy.lead, cta: copy.ctaLabel || copy.heading } };
    default: {
      const exhaustive: never = archetypeId;
      throw new Error(`Arquétipo desconhecido: ${String(exhaustive)}`);
    }
  }
}
