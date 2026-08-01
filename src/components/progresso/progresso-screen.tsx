"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/infra/db/supabase/client";
import { JOB_STEPS, JOB_STEP_PROGRESS, type JobState, type JobStep } from "@/core/domain/pipeline/job";
import { ScreenContainer } from "@/components/chrome/screen-container";
import { cn } from "@/lib/utils";

interface JobSnapshot {
  readonly step: JobStep;
  readonly progress: number;
  readonly state: JobState;
  readonly error: string | null;
}

export interface ProgressoScreenProps {
  readonly jobId: string;
  readonly initialJob: JobSnapshot;
  readonly theme: string | null;
  readonly handle: string | null;
  readonly editorHref: string;
  readonly geradorHref: string;
}

// Rótulo + serviço por step, literais do handoff (`Protótipo AD
// Mobile.dc.html`, const STEPS). O serviço em Mono cinza embaixo do
// rótulo é parte do design: a tela mostra a máquina trabalhando.
const STEPS: Record<JobStep, { readonly label: string; readonly service: string }> = {
  research: { label: "Criando estrutura", service: "ResearchService" },
  copy: { label: "Escrevendo conteúdo", service: "CopyService" },
  prompt: { label: "Gerando prompts", service: "PromptService" },
  image: { label: "Criando imagens", service: "ImageService" },
  render: { label: "Renderizando slides", service: "RenderService" },
  publish: { label: "Publicando", service: "PublishingGateway" },
  completed: { label: "Concluído", service: "job.completed" },
};

const STATUS_LABEL: Record<JobState, string> = {
  pending: "na fila",
  running: "gerando agora",
  completed: "carrossel pronto",
  failed: "falhou",
};

// Linhas do console preto — derivadas do estado real do job, não
// decorativas. O protótipo mostra provedor/tempo/tokens; aqui mostramos
// o que temos de verdade sem inventar número.
function logsFor(job: JobSnapshot, stepIndex: number): string[] {
  const lines = JOB_STEPS.slice(0, Math.max(0, stepIndex)).map((step) => {
    const { service } = STEPS[step];
    return `> ${service} · ok · ${JOB_STEP_PROGRESS[step]}%`;
  });

  if (job.state === "failed") {
    lines.push(`> erro · ${job.error ?? "desconhecido"}`);
  } else if (job.state === "completed") {
    lines.push("> job.completed · custo $0.00");
  } else {
    lines.push(`> ${STEPS[job.step].service} · rodando…`);
  }

  return lines;
}

// Assina mudanças em `jobs` via Supabase Realtime (README, "Pipeline de
// geração": "o cliente acompanha por Realtime"). Com o adapter `after`
// (config/queue.ts) o pipeline roda DEPOIS da resposta HTTP, então esta
// tela pega o job em movimento de verdade.
export function ProgressoScreen({ jobId, initialJob, theme, handle, editorHref, geradorHref }: ProgressoScreenProps) {
  const [job, setJob] = useState<JobSnapshot>(initialJob);

  useEffect(() => {
    if (job.state === "completed" || job.state === "failed") return;

    const supabase = createClient();
    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
        (payload) => {
          const row = payload.new as {
            step: JobStep;
            progress: number;
            state: JobState;
            error: string | null;
          };
          setJob({ step: row.step, progress: row.progress, state: row.state, error: row.error });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, job.state]);

  const stepIndex = JOB_STEPS.indexOf(job.step);
  const logs = logsFor(job, stepIndex);

  return (
    <ScreenContainer width="form" className="pt-7 pb-10">
      <div className="mb-3.5 font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">
        {`// job #${jobId.slice(0, 8)}${handle ? ` · ${handle}` : ""}`}
      </div>

      <h1 className="mb-1.5 text-[28px] leading-[1.1] font-bold tracking-[-.03em] text-pretty">
        {theme ?? "Geração"}
      </h1>
      <div className="mb-7 text-sm text-(--chrome-text)">{STATUS_LABEL[job.state]}</div>

      {/* Percentual gigante em Mono 46px/700 + barra de 4px com a
          transição exata do handoff. Antes era uma barra de 2px sem
          percentual nenhum. */}
      <div className="mb-3 flex items-baseline gap-3">
        <div className="font-mono text-[46px] leading-none font-bold tracking-[-.04em]">{job.progress}%</div>
        <div className="text-sm text-(--chrome-text)">{STEPS[job.step].label}</div>
      </div>
      <div className="mb-7 h-1 overflow-hidden rounded-sm bg-(--chrome-border)">
        <div
          className={cn("h-1 rounded-sm", job.state === "failed" ? "bg-red-500" : "bg-(--chrome-terminal)")}
          style={{ width: `${job.progress}%`, transition: "width 900ms cubic-bezier(.4,0,.2,1)" }}
        />
      </div>

      <div className="mb-4.5 overflow-hidden rounded-[11px] border border-(--chrome-border) bg-(--chrome-surface)">
        {JOB_STEPS.map((step, index) => {
          const isDone = job.state === "completed" || index < stepIndex;
          const isCurrent = index === stepIndex && job.state !== "completed";
          const isFailed = isCurrent && job.state === "failed";
          return (
            <div
              key={step}
              className="grid grid-cols-[20px_1fr_auto] items-center gap-3 border-b border-(--chrome-divider) px-3.75 py-3.5 last:border-b-0"
            >
              {/* ●/◐/○ — os três estados do handoff, não badges com ícone. */}
              <div
                aria-hidden
                className={cn(
                  "text-xs",
                  isFailed
                    ? "text-red-500"
                    : isDone
                      ? "text-(--chrome-ok)"
                      : isCurrent
                        ? "text-(--chrome-ink)"
                        : "text-(--chrome-line)",
                )}
              >
                {isFailed ? "×" : isDone ? "●" : isCurrent ? "◐" : "○"}
              </div>
              <div>
                <div
                  className={cn(
                    "text-[14.5px]",
                    isDone || isCurrent ? "text-(--chrome-ink)" : "text-(--chrome-muted)",
                  )}
                >
                  {STEPS[step].label}
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-(--chrome-muted)">{STEPS[step].service}</div>
              </div>
              <div className="font-mono text-[11px] text-(--chrome-muted)">{JOB_STEP_PROGRESS[step]}%</div>
            </div>
          );
        })}
      </div>

      {/* Console preto: #080808, r=11px, Mono 10.5px, line-height 1.9,
          min-height 120px, com cursor branco piscando no fim. */}
      <div className="noscroll min-h-30 overflow-x-auto rounded-[11px] bg-(--chrome-terminal) p-4 font-mono text-[10.5px] leading-[1.9] whitespace-nowrap text-(--chrome-terminal-text)">
        {logs.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        <span aria-hidden className="inline-block h-3 w-1.5 animate-blink bg-white align-middle" />
      </div>

      {job.state === "completed" && (
        <Link
          href={editorHref}
          className="mt-4.5 flex min-h-13 w-full items-center justify-center rounded-[10px] bg-(--chrome-terminal) p-4.25 text-[15.5px] font-semibold text-white"
        >
          Abrir no editor
        </Link>
      )}

      {job.state === "failed" && (
        <Link
          href={geradorHref}
          className="mt-4.5 flex min-h-13 w-full items-center justify-center rounded-[10px] border border-(--chrome-border) p-4.25 text-[15.5px] font-semibold text-(--chrome-text)"
        >
          Tentar de novo
        </Link>
      )}
    </ScreenContainer>
  );
}
