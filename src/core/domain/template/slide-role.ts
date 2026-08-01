// README, "Estilos de composição": "O gerador decide o papel de cada
// slide (capa · argumento · dado · citação · prova · fecho) e o estilo
// resolve a composição daquele papel. Trocar de estilo remonta o
// carrossel sem reescrever texto."
//
// Este é o papel EDITORIAL — a chave que `CompositionStyle.slideRecipes`
// usa para decidir arquétipo + variante. Não confundir com
// `StructureRole` (`application/services/research.service.ts`), que é
// posicional (abertura/conteúdo/fecho) e só orienta o prompt da copy.
export type SlideRole = "capa" | "argumento" | "dado" | "citacao" | "prova" | "fecho";

export const SLIDE_ROLES: readonly SlideRole[] = [
  "capa",
  "argumento",
  "dado",
  "citacao",
  "prova",
  "fecho",
] as const;

// Todo estilo precisa cobrir estes três: são os únicos papéis que o
// planejador garante que vão existir em qualquer carrossel (índice 0 e
// último são forçados; o miolo cai em `argumento` quando nenhum sinal
// mais específico bate). Invariante checada em teste no catálogo.
export const REQUIRED_SLIDE_ROLES: readonly SlideRole[] = ["capa", "argumento", "fecho"] as const;
