"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, PenLine, ImagePlus, Sparkles, LayoutTemplate, PackageCheck, CheckCircle2, XCircle, Check } from "lucide-react";
import { createClient } from "@/infra/db/supabase/client";
import { JOB_STEPS, type JobState, type JobStep } from "@/core/domain/pipeline/job";
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
  readonly editorHref: string;
  readonly geradorHref: string;
}

const STEP_LABEL: Record<JobStep, string> = {
  research: "Pesquisando o tema",
  copy: "Escrevendo os textos",
  prompt: "Montando os prompts de imagem",
  image: "Gerando as imagens",
  render: "Renderizando os slides",
  publish: "Preparando a exportação",
  completed: "Concluído",
};

const STEP_ICON: Record<JobStep, typeof Search> = {
  research: Search,
  copy: PenLine,
  prompt: ImagePlus,
  image: Sparkles,
  render: LayoutTemplate,
  publish: PackageCheck,
  completed: CheckCircle2,
};

// Assina mudanças em `jobs` via Supabase Realtime (README, "Pipeline de
// geração": "o cliente acompanha por Realtime") — com o adapter de fila
// inline (único implementado), o job já costuma estar completed/failed
// quando esta tela monta; a assinatura garante que também funcione com
// um adapter assíncrono (trigger.dev) sem trocar nada aqui.
export function ProgressoScreen({ jobId, initialJob, theme, editorHref, geradorHref }: ProgressoScreenProps) {
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

  return (
    <ScreenContainer width="form" className="pt-6 pb-10">
      <h1 className="mb-1 text-[28px] font-bold tracking-[-.03em] leading-[1.1]">Progresso</h1>
      {theme && <p className="mb-6 text-sm text-(--chrome-muted)">{theme}</p>}

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-(--chrome-surface)">
        <div
          className={cn("h-full rounded-full transition-all", job.state === "failed" ? "bg-red-500" : "bg-(--chrome-ink)")}
          style={{ width: `${job.progress}%` }}
        />
      </div>

      <div className="grid gap-2.5">
        {JOB_STEPS.map((step, index) => {
          const isDone = job.state === "completed" || index < stepIndex || (index === stepIndex && job.state !== "running" && job.state !== "failed");
          const isCurrent = step === job.step && job.state === "running";
          const isFailed = step === job.step && job.state === "failed";
          const Icon = STEP_ICON[step];
          return (
            <div key={step} className="flex items-center gap-3 rounded-[9px] border border-(--chrome-border) bg-(--chrome-surface) px-3.5 py-2.5">
              <div
                className={cn(
                  "flex size-7 flex-none items-center justify-center rounded-full",
                  isFailed
                    ? "bg-red-100 text-red-600"
                    : isDone
                      ? "bg-(--chrome-ok)/15 text-(--chrome-ok)"
                      : isCurrent
                        ? "bg-(--chrome-ink) text-white"
                        : "bg-(--chrome-surface-2) text-(--chrome-faint)",
                )}
              >
                {isFailed ? (
                  <XCircle className="size-4" strokeWidth={2} />
                ) : isDone ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : (
                  <Icon className={cn("size-3.5", isCurrent && "animate-pulse")} strokeWidth={2} />
                )}
              </div>
              <span className={cn("text-sm", isDone || isCurrent || isFailed ? "text-(--chrome-ink)" : "text-(--chrome-muted)")}>
                {STEP_LABEL[step]}
              </span>
            </div>
          );
        })}
      </div>

      {job.state === "failed" && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          Falhou: {job.error ?? "erro desconhecido"}
        </div>
      )}

      {job.state === "completed" && (
        <Link
          href={editorHref}
          className="mt-6 flex items-center justify-center gap-2 rounded-md bg-(--chrome-ink) px-4 py-3 text-center font-mono text-[12px] uppercase tracking-widest text-white"
        >
          <CheckCircle2 className="size-4" />
          Abrir no editor
        </Link>
      )}

      {job.state === "failed" && (
        <Link
          href={geradorHref}
          className="mt-3 block rounded-md border border-(--chrome-border) px-4 py-3 text-center font-mono text-[12px] uppercase tracking-widest text-(--chrome-text)"
        >
          Tentar de novo
        </Link>
      )}
    </ScreenContainer>
  );
}
