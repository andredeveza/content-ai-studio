import type { PostRepository } from "@/core/domain/ports/post-repository";
import { NotFoundError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

// Cancela o agendamento (remove o post) — o projeto continua existindo,
// só sai da Agenda.
export class UnschedulePostUseCase {
  constructor(private readonly posts: PostRepository) {}

  async execute(orgId: string, postId: string): Promise<Result<void, AppError>> {
    const deleted = await this.posts.delete(orgId, postId);
    if (!deleted) return err(new NotFoundError(`Post ${postId} não encontrado.`));
    return ok(undefined);
  }
}
