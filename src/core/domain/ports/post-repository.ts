import type { CalendarPost, NewPost, Post, PostStatus } from "@/core/domain/post/post";

export interface PostRepository {
  // Upsert por `project_id` (unique na tabela) — reagendar só chama de
  // novo, sem precisar checar se já existe.
  upsertSchedule(input: NewPost): Promise<Post>;
  findByProjectId(orgId: string, projectId: string): Promise<Post | null>;
  updateStatus(orgId: string, postId: string, status: PostStatus): Promise<Post | null>;
  delete(orgId: string, postId: string): Promise<boolean>;
  // `monthStart`/`monthEnd` em ISO — intervalo `[monthStart, monthEnd)`.
  listForCalendar(orgId: string, monthStart: string, monthEnd: string): Promise<CalendarPost[]>;
}
