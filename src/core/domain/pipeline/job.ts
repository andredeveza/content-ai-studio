// README, "Pipeline de geração": sete steps idempotentes com checkpoint
// persistido. `step` é sempre o próximo step a rodar (ou o que está
// rodando agora) — um step só avança este campo depois de terminar com
// sucesso, então uma falha no meio de um step nunca o avança, e retomar
// o job reexecuta exatamente aquele step (nunca do zero).
export type JobStep = "research" | "copy" | "prompt" | "image" | "render" | "publish" | "completed";
export type JobState = "pending" | "running" | "completed" | "failed";

export const JOB_STEPS: readonly JobStep[] = [
  "research",
  "copy",
  "prompt",
  "image",
  "render",
  "publish",
  "completed",
];

export const JOB_STEP_PROGRESS: Readonly<Record<JobStep, number>> = {
  research: 5,
  copy: 20,
  prompt: 40,
  image: 60,
  render: 80,
  publish: 95,
  completed: 100,
};

// Resultado acumulado de cada step já concluído — é o que permite
// retomar do step que falhou sem refazer os anteriores.
export interface JobCheckpoint {
  readonly structure?: unknown;
  readonly copy?: unknown;
  readonly prompts?: Record<number, string>;
  readonly mediaUrls?: Record<number, string>;
  readonly [key: string]: unknown;
}

export interface Job {
  readonly id: string;
  readonly orgId: string;
  readonly projectId: string;
  readonly step: JobStep;
  readonly progress: number;
  readonly attempts: number;
  readonly payload: JobCheckpoint;
  readonly state: JobState;
  readonly error: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NewJob {
  readonly orgId: string;
  readonly projectId: string;
}

export interface JobPatch {
  readonly step?: JobStep;
  readonly progress?: number;
  readonly attempts?: number;
  readonly payload?: JobCheckpoint;
  readonly state?: JobState;
  readonly error?: string | null;
}
