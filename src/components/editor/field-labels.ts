import type { ArchetypeId } from "@/core/domain/template/blueprint";

// Rótulos em PT-BR pra cada slot de texto dos 8 arquétipos (bloco 4).
// Puramente de apresentação — por isso mora no componente, não no
// domínio. O protótipo do Editor (design/Content AI Studio - Protótipo
// AD Mobile.dc.html) só tem "título"/"corpo" porque simplifica pra 4
// variantes; nosso sistema tem 8 arquétipos com formatos de conteúdo
// diferentes (citação tem quote/author, evento tem day/month/detail),
// então o inspector mostra um campo por slot real em vez de forçar
// título+corpo em tudo.
export const FIELD_LABELS: Record<ArchetypeId, Record<string, string>> = {
  "cover-centro": { kicker: "Chamada", heading: "Título", lead: "Apoio" },
  numerada: { number: "Número", heading: "Título" },
  citacao: { quote: "Citação", author: "Autor" },
  dado: { heading: "Título" },
  "foto-total": { heading: "Título" },
  "lista-icone": { heading: "Título", item1: "Item 1", item2: "Item 2", item3: "Item 3" },
  evento: { day: "Dia", month: "Mês", heading: "Título", detail: "Detalhe" },
  fecho: { heading: "Título", lead: "Apoio", cta: "Botão (CTA)" },
};

export function labelFor(archetypeId: ArchetypeId, slotKey: string): string {
  return FIELD_LABELS[archetypeId]?.[slotKey] ?? slotKey;
}
