import type { PostRepository } from "@/core/domain/ports/post-repository";
import type { Post, PostStatus } from "@/core/domain/post/post";
import { NotFoundError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

// Bloco 10: sem publicação automática de verdade no MVP (só o canal
// `export`, bloco 9), "publicado" é marcado à mão na Agenda depois que o
// cliente posta manualmente o zip exportado.
export class UpdatePostStatusUseCase {
  constructor(private readonly posts: PostRepository) {}

  async execute(orgId: string, postId: string, status: PostStatus): Promise<Result<Post, AppError>> {
    const updated = await this.posts.updateStatus(orgId, postId, status);
    if (!updated) return err(new NotFoundError(`Post ${postId} não encontrado.`));
    return ok(updated);
  }
}
