"use server";

import { getAgendaRepositories } from "@/infra/agenda/bootstrap";
import { getCurrentSession } from "@/lib/session";
import { UnschedulePostUseCase } from "@/core/application/use-cases/unschedule-post";
import { UpdatePostStatusUseCase } from "@/core/application/use-cases/update-post-status";

export type AgendaActionResult = { ok: true } | { ok: false; error: string };

// Sem publicação automática no MVP (só o canal `export`, bloco 9) — o
// cliente posta o zip na mão e marca aqui quando já publicou.
export async function markPublished(orgId: string, postId: string): Promise<AgendaActionResult> {
  const session = await getCurrentSession();
  if (!session || session.orgId !== orgId) return { ok: false, error: "Não autorizado." };

  const { posts } = getAgendaRepositories();
  const result = await new UpdatePostStatusUseCase(posts).execute(orgId, postId, "published");
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

export async function cancelSchedule(orgId: string, postId: string): Promise<AgendaActionResult> {
  const session = await getCurrentSession();
  if (!session || session.orgId !== orgId) return { ok: false, error: "Não autorizado." };

  const { posts } = getAgendaRepositories();
  const result = await new UnschedulePostUseCase(posts).execute(orgId, postId);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}
