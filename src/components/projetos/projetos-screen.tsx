import Link from "next/link";
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
          className="rounded-full bg-(--chrome-ink) px-4 py-2 font-mono text-[11px] uppercase tracking-[.1em] text-white"
        >
          + novo
        </Link>
      </div>

      {projects.length === 0 && (
        <div className="rounded-md border border-dashed border-(--chrome-border) p-6 text-center text-sm text-(--chrome-muted)">
          Nenhum carrossel gerado ainda.
        </div>
      )}

      <div className="grid gap-2.5">
        {projects.map((project) => {
          const inner = (
            <div className="rounded-[9px] border border-(--chrome-border) bg-(--chrome-surface) p-3.5">
              <div className="text-[15px] font-medium leading-[1.3]">{project.theme}</div>
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
