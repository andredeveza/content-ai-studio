"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { getEditorRepositories } from "@/infra/editor/bootstrap";
import { getAcervoRepositories } from "@/infra/acervo/bootstrap";
import { getIngestAssetUseCase, getAnalyzeAssetUseCase, getImportSiteUseCase } from "@/infra/acervo/ingestion-bootstrap";
import { getCurrentSession } from "@/lib/session";
import { UpdateClientUseCase } from "@/core/application/use-cases/update-client";
import { DeleteClientUseCase } from "@/core/application/use-cases/delete-client";
import { UpsertBrandKitUseCase } from "@/core/application/use-cases/upsert-brand-kit";
import { UploadBrandLogoUseCase } from "@/core/application/use-cases/upload-brand-logo";
import type { UpdateClientInput } from "@/core/application/dto/client.dto";
import type { UpsertBrandKitInput } from "@/core/application/dto/brand-kit.dto";
import type { IngestAssetActionResult, ImportSiteActionResult } from "@/components/marca/marca-detail-screen";

export type MarcaActionResult = { ok: true } | { ok: false; error: string };

export async function updateClient(
  orgId: string,
  clientId: string,
  input: UpdateClientInput,
): Promise<MarcaActionResult> {
  const session = await getCurrentSession();
  if (!session || session.orgId !== orgId) return { ok: false, error: "Não autorizado." };

  const { clients } = getEditorRepositories();
  const result = await new UpdateClientUseCase(clients).execute(orgId, clientId, input);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

export async function upsertBrandKit(
  orgId: string,
  clientId: string,
  input: UpsertBrandKitInput,
): Promise<MarcaActionResult> {
  const session = await getCurrentSession();
  if (!session || session.orgId !== orgId) return { ok: false, error: "Não autorizado." };

  const { clients, brandKits } = getEditorRepositories();
  const result = await new UpsertBrandKitUseCase(clients, brandKits).execute(orgId, clientId, input);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

export async function uploadLogo(orgId: string, clientId: string, formData: FormData): Promise<MarcaActionResult> {
  const session = await getCurrentSession();
  if (!session || session.orgId !== orgId) return { ok: false, error: "Não autorizado." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Nenhum arquivo enviado." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const { clients, brandKits, brandLogoStorage } = getEditorRepositories();
  const result = await new UploadBrandLogoUseCase(clients, brandKits, brandLogoStorage).execute(orgId, clientId, {
    file: buffer,
    contentType: file.type,
  });
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

// ADENDO-02, "Defeito 2": dropzone de arquivo no topo da tela Marca —
// ingestão (upload) e extração (análise) rodam em sequência aqui, não
// via Realtime (o adapter de fila inline já resolve isso síncrono, mesmo
// raciocínio do Gerador/PipelineWorker).
export async function ingestAsset(orgId: string, clientId: string, formData: FormData): Promise<IngestAssetActionResult> {
  const session = await getCurrentSession();
  if (!session || session.orgId !== orgId) return { ok: false, error: "Não autorizado." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Nenhum arquivo enviado." };
  if (file.size < 1024) return { ok: false, error: `Arquivo "${file.name}" está vazio ou corrompido.` };

  const buffer = Buffer.from(await file.arrayBuffer());
  const ingested = await getIngestAssetUseCase().execute({
    orgId,
    clientId,
    key: randomUUID(),
    filename: file.name,
    mime: file.type || "application/octet-stream",
    file: buffer,
  });
  if (!ingested.ok) return { ok: false, error: ingested.error.message };

  const analyzed = await getAnalyzeAssetUseCase().execute(orgId, ingested.value.id);
  if (!analyzed.ok) return { ok: false, error: analyzed.error.message };

  const { assetsStorage } = getAcervoRepositories();
  const url = analyzed.value.kind === "image" ? assetsStorage.getPublicUrl(analyzed.value.path) : null;
  return { ok: true, asset: { ...analyzed.value, url } };
}

// ADENDO-02, "Defeito 2, correção 1": um dos 3 importadores em massa —
// o único com implementação real nesta correção (README trata
// Instagram como Graph API na conta do próprio cliente, fora do escopo
// urgente; ZIP fica para uma iteração futura — ver PROGRESSO.md).
export async function importSite(orgId: string, clientId: string, url: string): Promise<ImportSiteActionResult> {
  const session = await getCurrentSession();
  if (!session || session.orgId !== orgId) return { ok: false, error: "Não autorizado." };

  const result = await getImportSiteUseCase().execute({ orgId, clientId, userId: session.userId, url });
  if (!result.ok) return { ok: false, error: result.error.message };

  const { assetsStorage } = getAcervoRepositories();
  const logo = result.value.ingestedLogo;
  const ingestedLogo = logo ? { ...logo, url: logo.kind === "image" ? assetsStorage.getPublicUrl(logo.path) : null } : null;
  return { ok: true, result: { ...result.value, ingestedLogo } };
}

export async function deleteClient(orgId: string, clientId: string): Promise<MarcaActionResult> {
  const session = await getCurrentSession();
  if (!session || session.orgId !== orgId) return { ok: false, error: "Não autorizado." };

  const { clients } = getEditorRepositories();
  const result = await new DeleteClientUseCase(clients).execute(orgId, clientId);
  if (!result.ok) return { ok: false, error: result.error.message };
  redirect("/marca");
}
