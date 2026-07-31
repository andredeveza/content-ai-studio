export type PostStatus = "scheduled" | "published" | "failed";

export interface Post {
  readonly id: string;
  readonly orgId: string;
  readonly projectId: string;
  readonly scheduledAt: string;
  readonly status: PostStatus;
  readonly channelTargets: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NewPost {
  readonly orgId: string;
  readonly projectId: string;
  readonly scheduledAt: string;
  readonly channelTargets?: readonly string[];
}

// Projeção pra tela da Agenda (README, Telas > "4. Agenda"): já vem com
// os campos de exibição (tema, handle do cliente) resolvidos via join —
// não é o agregado de domínio `Post`, é uma leitura específica de tela.
export interface CalendarPost {
  readonly id: string;
  readonly projectId: string;
  readonly scheduledAt: string;
  readonly status: PostStatus;
  readonly theme: string;
  readonly handle: string | null;
}
