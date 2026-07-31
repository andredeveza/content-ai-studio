"use server";

import { getEditorRepositories } from "@/infra/editor/bootstrap";
import { getCurrentSession } from "@/lib/session";
import { CreateClientUseCase } from "@/core/application/use-cases/create-client";

export type CreateClientActionResult = { ok: true; clientId: string } | { ok: false; error: string };

export async function createClient(orgId: string, name: string): Promise<CreateClientActionResult> {
  const session = await getCurrentSession();
  if (!session || session.orgId !== orgId) {
    return { ok: false, error: "Não autorizado." };
  }

  const { clients } = getEditorRepositories();
  const result = await new CreateClientUseCase(clients).execute({ orgId, name });

  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true, clientId: result.value.id };
}
