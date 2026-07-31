"use server";

import { redirect } from "next/navigation";
import { getGenerateCarouselUseCase } from "@/infra/pipeline/bootstrap";
import { getCurrentSession } from "@/lib/session";
import type { ProjectGoal, ProjectRatio } from "@/core/domain/project/project";

export type GenerateActionResult = { ok: false; error: string };

// `orgId` chega pré-preenchido via `.bind(null, session.orgId)` na page
// (Server Component) — o Client Component nunca escolhe a própria org.
// `queue.enqueue` do adapter inline (único implementado) roda o pipeline
// inteiro antes desta action retornar, então o redirect já manda pra
// Progresso com o job praticamente resolvido (completed ou failed).
export async function generateCarousel(
  orgId: string,
  input: {
    clientId: string;
    theme: string;
    goal: ProjectGoal;
    slideCount: number;
    ratio: ProjectRatio;
  },
): Promise<GenerateActionResult> {
  const session = await getCurrentSession();
  if (!session || session.orgId !== orgId) {
    return { ok: false, error: "Não autorizado." };
  }

  const useCase = getGenerateCarouselUseCase();
  const result = await useCase.execute({ orgId, ...input });

  if (!result.ok) return { ok: false, error: result.error.message };
  redirect(`/progresso/${result.value.jobId}`);
}
