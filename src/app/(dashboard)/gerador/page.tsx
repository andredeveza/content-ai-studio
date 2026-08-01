import { redirect } from "next/navigation";
import { GeradorScreen } from "@/components/gerador/gerador-screen";
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

  const { clients } = getEditorRepositories();
  const orgClients = await clients.listByOrg(session.orgId);

  return (
    <GeradorScreen
      clients={orgClients.map((client) => ({ id: client.id, name: client.name }))}
      generateAction={generateCarousel.bind(null, session.orgId)}
    />
  );
}
