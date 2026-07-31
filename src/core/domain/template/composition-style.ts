// README, "Estilos de composição": o template define ONDE as coisas
// ficam, o estilo define COMO aquilo se compõe. Catálogo estático (não
// uma tabela — ver PROGRESSO.md pelas razões da simplificação): 8
// entradas, cada uma com `requires` avaliado ao vivo contra o acervo do
// cliente (ADENDO-01, "Cobertura de estilos").
export type StyleRequirementNeed =
  | { readonly kind: "image"; readonly ratio?: "4:5" | "1:1" | "9:16"; readonly darkBand?: "top" | "bottom"; readonly min?: number }
  | { readonly kind: "numeric-series" }
  | { readonly kind: "quote-source" }
  | { readonly kind: "logo" };

export interface CompositionStyle {
  readonly id: string;
  readonly name: string;
  readonly requires: readonly StyleRequirementNeed[];
}

export const COMPOSITION_STYLES: readonly CompositionStyle[] = [
  {
    id: "manchete-sangrada",
    name: "Manchete sangrada",
    requires: [{ kind: "image", darkBand: "bottom" }],
  },
  { id: "noite-futurista", name: "Noite futurista", requires: [] },
  {
    id: "revista-autoral",
    name: "Revista autoral",
    requires: [{ kind: "image", ratio: "4:5" }],
  },
  { id: "fio-de-thread", name: "Fio de thread", requires: [] },
  {
    id: "canto-escuro",
    name: "Canto escuro",
    requires: [{ kind: "image", ratio: "4:5", darkBand: "bottom" }],
  },
  { id: "nevoa-suave", name: "Névoa suave", requires: [] },
  { id: "grade-silenciosa", name: "Grade silenciosa", requires: [] },
  { id: "capa-de-campanha", name: "Capa de campanha", requires: [] },
] as const;
