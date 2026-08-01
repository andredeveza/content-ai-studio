import { redirect } from "next/navigation";
import { GeradorScreen, type GeradorClientOption } from "@/components/gerador/gerador-screen";
import { StyleCoverageService } from "@/core/application/services/style-coverage.service";
import { COMPOSITION_STYLES } from "@/core/domain/template/composition-styles.catalog";
import { getAcervoRepositories } from "@/infra/acervo/bootstrap";
import { getEditorRepositories } from "@/infra/editor/bootstrap";
import { getCurrentSession } from "@/lib/session";
import { generateCarousel } from "./actions";

// `generateCarousel` (server action desta página) usa `after()`
// (`infra/queue/after-queue.ts`) pra rodar o pipeline inteiro em
// background depois do redirect pra Progresso — a function instance
// continua viva até o callback terminar ou até `maxDuration` estourar,
// o que for primeiro. Route Segment Config de uma page vale pras server
// actions vinculadas a ela (doc do Next). 300s é o teto do plano Pro;
// no plano Hobby a Vercel limita a execução real a 60s independente
// deste valor — só confirmável rodando uma geração real em produção e
// medindo (pendência: qual plano está ativo).
export const maxDuration = 300;

export default async function GeradorPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const { clients, brandKits } = getEditorRepositories();
  const { assets } = getAcervoRepositories();
  const orgClients = await clients.listByOrg(session.orgId);

  // README, "Estilos de composição" > "Recomendação automática":
  // `requires` é avaliado contra o acervo do cliente ANTES de listar as
  // opções, e estilo bloqueado aparece "desabilitado com o motivo à
  // mostra — nunca silenciosamente ausente". Como o Gerador troca de
  // cliente sem recarregar, a cobertura de todos vem pré-calculada.
  const coverage = new StyleCoverageService(assets);
  const clientOptions: GeradorClientOption[] = await Promise.all(
    orgClients.map(async (client) => {
      const brandKit = await brandKits.findByClientId(client.id);
      const result = await coverage.evaluate(session.orgId, client.id, brandKit);
      return {
        id: client.id,
        name: client.name,
        styles: result.styles.map((style) => ({
          id: style.id,
          available: style.available,
          reason: style.reason,
        })),
      };
    }),
  );

  return (
    <GeradorScreen
      clients={clientOptions}
      styles={COMPOSITION_STYLES.map((style) => ({
        id: style.slug,
        name: style.name,
        sourceRef: style.sourceRef,
        format: style.format,
      }))}
      generateAction={generateCarousel.bind(null, session.orgId)}
    />
  );
}
