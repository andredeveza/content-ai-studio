import { describe, expect, it } from "vitest";
import { UnschedulePostUseCase } from "@/core/application/use-cases/unschedule-post";
import type { CalendarPost, NewPost, Post, PostStatus } from "@/core/domain/post/post";
import type { PostRepository } from "@/core/domain/ports/post-repository";

class FakePostRepository implements PostRepository {
  constructor(private rows: Set<string>) {}
  async upsertSchedule(_input: NewPost): Promise<Post> {
    throw new Error("não usado");
  }
  async findByProjectId(): Promise<Post | null> {
    throw new Error("não usado");
  }
  async updateStatus(_orgId: string, _postId: string, _status: PostStatus): Promise<Post | null> {
    throw new Error("não usado");
  }
  async delete(_orgId: string, postId: string): Promise<boolean> {
    return this.rows.delete(postId);
  }
  async listForCalendar(): Promise<CalendarPost[]> {
    throw new Error("não usado");
  }
}

describe("UnschedulePostUseCase (bloco 10)", () => {
  it("remove o agendamento existente", async () => {
    const posts = new FakePostRepository(new Set(["post-1"]));
    const result = await new UnschedulePostUseCase(posts).execute("org-1", "post-1");
    expect(result.ok).toBe(true);
  });

  it("retorna erro quando o post não existe", async () => {
    const posts = new FakePostRepository(new Set());
    const result = await new UnschedulePostUseCase(posts).execute("org-1", "post-inexistente");
    expect(result.ok).toBe(false);
  });
});
