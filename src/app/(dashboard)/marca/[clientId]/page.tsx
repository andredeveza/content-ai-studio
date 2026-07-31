import { notFound, redirect } from "next/navigation";
import { MarcaDetailScreen } from "@/components/marca/marca-detail-screen";
import { getEditorRepositories } from "@/infra/editor/bootstrap";
import { getAcervoRepositories } from "@/infra/acervo/bootstrap";
import { StyleCoverageService } from "@/core/application/services/style-coverage.service";
import { getCurrentSession } from "@/lib/session";
import { deleteClient, ingestAsset, importSite, updateClient, uploadLogo, upsertBrandKit } from "./actions";

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

  const { assets, assetsStorage } = getAcervoRepositories();
  const clientAssets = await assets.listByClient(session.orgId, clientId);
  const coverage = await new StyleCoverageService(assets).evaluate(session.orgId, clientId, brandKit);

  // Server Component -> Client Component só passa dados serializáveis
  // (nunca uma closure) — a URL pública é resolvida aqui, não via uma
  // função `getAssetUrl` passada como prop (RSC rejeita isso em tempo
  // de execução com "Object.defineProperty called on non-object").
  const clientAssetsWithUrl = clientAssets.map((asset) => ({
    ...asset,
    url: asset.kind === "image" ? assetsStorage.getPublicUrl(asset.path) : null,
  }));

  return (
    <MarcaDetailScreen
      client={client}
      brandKit={brandKit}
      logoUrl={logoUrl}
      assets={clientAssetsWithUrl}
      coverage={coverage}
      updateClientAction={updateClient.bind(null, session.orgId, clientId)}
      upsertBrandKitAction={upsertBrandKit.bind(null, session.orgId, clientId)}
      uploadLogoAction={uploadLogo.bind(null, session.orgId, clientId)}
      deleteClientAction={deleteClient.bind(null, session.orgId, clientId)}
      ingestAssetAction={ingestAsset.bind(null, session.orgId, clientId)}
      importSiteAction={importSite.bind(null, session.orgId, clientId)}
    />
  );
}
