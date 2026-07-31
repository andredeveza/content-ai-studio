// Opções do rádio "objetivo" no Gerador (design/Content AI Studio -
// Protótipo AD Mobile.dc.html): educar, construir autoridade, converter
// em venda, quebrar objeção.
export type ProjectGoal = "educar" | "autoridade" | "converter" | "mito";
export type ProjectStatus = "draft" | "running" | "completed" | "failed";
export type ProjectRatio = "4:5" | "1:1" | "9:16";

export interface Project {
  readonly id: string;
  readonly orgId: string;
  readonly clientId: string;
  readonly theme: string;
  readonly goal: ProjectGoal;
  readonly status: ProjectStatus;
  readonly progress: number;
  readonly slideCount: number;
  readonly ratio: ProjectRatio;
  readonly caption: string | null;
  readonly hashtags: readonly string[];
  readonly cta: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NewProject {
  readonly orgId: string;
  readonly clientId: string;
  readonly theme: string;
  readonly goal: ProjectGoal;
  readonly slideCount: number;
  readonly ratio?: ProjectRatio;
}

export interface ProjectPatch {
  readonly status?: ProjectStatus;
  readonly progress?: number;
  readonly caption?: string | null;
  readonly hashtags?: readonly string[];
  readonly cta?: string | null;
}

export function canvasForRatio(ratio: ProjectRatio): { readonly w: number; readonly h: number } {
  if (ratio === "1:1") return { w: 1080, h: 1080 };
  if (ratio === "9:16") return { w: 1080, h: 1920 };
  return { w: 1080, h: 1350 };
}
