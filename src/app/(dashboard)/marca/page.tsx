import { redirect } from "next/navigation";
import { MarcaListScreen } from "@/components/marca/marca-list-screen";
import { getEditorRepositories } from "@/infra/editor/bootstrap";
import { getCurrentSession } from "@/lib/session";
import { createClient } from "./actions";

export default async function MarcaPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const { clients } = getEditorRepositories();
  const orgClients = await clients.listByOrg(session.orgId);

  return (
    <MarcaListScreen
      clients={orgClients.map((client) => ({ id: client.id, name: client.name, hasSite: Boolean(client.site) }))}
      createClientAction={createClient.bind(null, session.orgId)}
    />
  );
}
