// Opções do rádio "objetivo" no Gerador (design/Content AI Studio -
// Protótipo AD Mobile.dc.html): educar, construir autoridade, converter
// em venda, quebrar objeção.
export type ProjectGoal = "educar" | "autoridade" | "converter" | "mito";
export type ProjectStatus = "draft" | "running" | "completed" | "failed";
export type ProjectRatio = "4:5" | "1:1" | "9:16";
// README, "Estilos de composição": o 08 é o único `single` — "o corpo do
// conteúdo vive na legenda, não em slides", e o gerador precisa oferecer
// post único e carrossel como caminhos distintos.
export type ProjectFormat = "carousel" | "single";
// De onde veio a imagem dos slides. `none` é o caso honesto de cliente
// sem acervo — vira aviso na tela, nunca falha silenciosa.
export type ProjectMediaSource = "acervo" | "ai" | "none";

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
  readonly styleId: string;
  readonly format: ProjectFormat;
  readonly mediaSource: ProjectMediaSource | null;
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
  readonly styleId?: string;
  readonly format?: ProjectFormat;
}

export interface ProjectPatch {
  readonly status?: ProjectStatus;
  readonly progress?: number;
  readonly mediaSource?: ProjectMediaSource;
  readonly caption?: string | null;
  readonly hashtags?: readonly string[];
  readonly cta?: string | null;
}

export function canvasForRatio(ratio: ProjectRatio): { readonly w: number; readonly h: number } {
  if (ratio === "1:1") return { w: 1080, h: 1080 };
  if (ratio === "9:16") return { w: 1080, h: 1920 };
  return { w: 1080, h: 1350 };
}
