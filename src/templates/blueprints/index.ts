import type { ArchetypeId, Blueprint } from "@/core/domain/template/blueprint";
import { coverCentro } from "@/templates/blueprints/cover-centro";
import { numerada } from "@/templates/blueprints/numerada";
import { citacao } from "@/templates/blueprints/citacao";
import { dado } from "@/templates/blueprints/dado";
import { fotoTotal } from "@/templates/blueprints/foto-total";
import { listaIcone } from "@/templates/blueprints/lista-icone";
import { evento } from "@/templates/blueprints/evento";
import { fecho } from "@/templates/blueprints/fecho";

export const BLUEPRINTS: Record<ArchetypeId, Blueprint> = {
  "cover-centro": coverCentro,
  numerada,
  citacao,
  dado,
  "foto-total": fotoTotal,
  "lista-icone": listaIcone,
  evento,
  fecho,
};

export const ALL_ARCHETYPE_IDS: readonly ArchetypeId[] = Object.keys(BLUEPRINTS) as ArchetypeId[];

export function getBlueprint(id: ArchetypeId): Blueprint {
  return BLUEPRINTS[id];
}
