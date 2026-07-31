import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle, FileClock, Plus } from "lucide-react";
import type { ProjectStatus } from "@/core/domain/project/project";

export interface ProjetosProjectData {
  readonly id: string;
  readonly theme: string;
  readonly status: ProjectStatus;
  readonly progress: number;
  readonly slideCount: number;
  readonly ratio: string;
  readonly createdAt: string;
}

export interface ProjetosScreenProps {
  readonly projects: readonly ProjetosProjectData[];
  readonly geradorHref: string;
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "rascunho",
  running: "gerando",
  completed: "concluído",
  failed: "falhou",
};

const STATUS_ICON: Record<ProjectStatus, typeof CheckCircle2> = {
  draft: FileClock,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
};

function statusColorVar(status: ProjectStatus): string {
  if (status === "completed") return "var(--chrome-ok)";
  if (status === "failed") return "var(--destructive)";
  return "var(--chrome-muted)";
}

export function ProjetosScreen({ projects, geradorHref }: ProjetosScreenProps) {
  return (
    <div className="px-4 pt-6 pb-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-[28px] font-bold tracking-[-.03em] leading-[1.1]">Projetos</h1>
        <Link
          href={geradorHref}
          className="flex items-center gap-1.5 rounded-full bg-(--chrome-ink) px-4 py-2 font-mono text-[11px] uppercase tracking-[.1em] text-white"
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
          novo
        </Link>
      </div>

      {projects.length === 0 && (
        <div className="relative h-40 overflow-hidden rounded-2xl border border-(--chrome-border)">
          <Image src="/brand/empty-projects.jpg" alt="" aria-hidden="true" fill sizes="480px" className="object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-sm font-medium text-white">Nenhum carrossel gerado ainda.</p>
            <Link href={geradorHref} className="mt-1 inline-block text-xs text-white/70 underline underline-offset-4">
              Criar o primeiro no Gerador
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-2.5">
        {projects.map((project) => {
          const Icon = STATUS_ICON[project.status];
          const inner = (
            <div className="rounded-[9px] border border-(--chrome-border) bg-(--chrome-surface) p-3.5 transition-colors active:bg-(--chrome-surface-2)">
              <div className="flex items-start justify-between gap-3">
                <div className="text-[15px] font-medium leading-[1.3]">{project.theme}</div>
                <Icon
                  className={project.status === "running" ? "size-4 flex-none animate-spin" : "size-4 flex-none"}
                  style={{ color: statusColorVar(project.status) }}
                  strokeWidth={2}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10.5px] text-(--chrome-muted)">
                <span style={{ color: statusColorVar(project.status) }}>{STATUS_LABEL[project.status]}</span>
                <span>·</span>
                <span>{project.slideCount} slides</span>
                <span>·</span>
                <span>{project.ratio}</span>
                {project.status === "running" && (
                  <>
                    <span>·</span>
                    <span>{project.progress}%</span>
                  </>
                )}
              </div>
            </div>
          );

          return project.status === "completed" ? (
            <Link key={project.id} href={`/projects/${project.id}/editor`}>
              {inner}
            </Link>
          ) : (
            <div key={project.id}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
