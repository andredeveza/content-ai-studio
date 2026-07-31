import { notFound, redirect } from "next/navigation";
import { MarcaDetailScreen } from "@/components/marca/marca-detail-screen";
import { getEditorRepositories } from "@/infra/editor/bootstrap";
import { getCurrentSession } from "@/lib/session";
import { deleteClient, updateClient, uploadLogo, upsertBrandKit } from "./actions";

interface MarcaDetailPageProps {
  readonly params: Promise<{ clientId: string }>;
}

export default async function MarcaDetailPage({ params }: MarcaDetailPageProps) {
  const { clientId } = await params;
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const { clients, brandKits, brandLogoStorage } = getEditorRepositories();
  const client = await clients.findById(session.orgId, clientId);
  if (!client) notFound();

  const brandKit = await brandKits.findByClientId(clientId);
  const logoUrl = brandKit?.logo.path ? brandLogoStorage.getPublicUrl(brandKit.logo.path) : null;

  return (
    <MarcaDetailScreen
      client={client}
      brandKit={brandKit}
      logoUrl={logoUrl}
      updateClientAction={updateClient.bind(null, session.orgId, clientId)}
      upsertBrandKitAction={upsertBrandKit.bind(null, session.orgId, clientId)}
      uploadLogoAction={uploadLogo.bind(null, session.orgId, clientId)}
      deleteClientAction={deleteClient.bind(null, session.orgId, clientId)}
    />
  );
}
