import { redirect } from "next/navigation";
import { GeradorScreen } from "@/components/gerador/gerador-screen";
import { getEditorRepositories } from "@/infra/editor/bootstrap";
import { getCurrentSession } from "@/lib/session";
import { generateCarousel } from "./actions";

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
