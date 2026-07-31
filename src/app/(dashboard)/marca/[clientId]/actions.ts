"use server";

import { redirect } from "next/navigation";
import { getEditorRepositories } from "@/infra/editor/bootstrap";
import { getCurrentSession } from "@/lib/session";
import { UpdateClientUseCase } from "@/core/application/use-cases/update-client";
import { DeleteClientUseCase } from "@/core/application/use-cases/delete-client";
import { UpsertBrandKitUseCase } from "@/core/application/use-cases/upsert-brand-kit";
import { UploadBrandLogoUseCase } from "@/core/application/use-cases/upload-brand-logo";
import type { UpdateClientInput } from "@/core/application/dto/client.dto";
import type { UpsertBrandKitInput } from "@/core/application/dto/brand-kit.dto";

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

export async function deleteClient(orgId: string, clientId: string): Promise<MarcaActionResult> {
  const session = await getCurrentSession();
  if (!session || session.orgId !== orgId) return { ok: false, error: "Não autorizado." };

  const { clients } = getEditorRepositories();
  const result = await new DeleteClientUseCase(clients).execute(orgId, clientId);
  if (!result.ok) return { ok: false, error: result.error.message };
  redirect("/marca");
}
