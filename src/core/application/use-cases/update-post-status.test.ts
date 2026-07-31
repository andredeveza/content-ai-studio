import { describe, expect, it } from "vitest";
import { UpdatePostStatusUseCase } from "@/core/application/use-cases/update-post-status";
import type { CalendarPost, NewPost, Post, PostStatus } from "@/core/domain/post/post";
import type { PostRepository } from "@/core/domain/ports/post-repository";

const now = "2026-01-01T00:00:00.000Z";

class FakePostRepository implements PostRepository {
  constructor(private post: Post | null) {}
  async upsertSchedule(_input: NewPost): Promise<Post> {
    throw new Error("não usado");
  }
  async findByProjectId(): Promise<Post | null> {
    throw new Error("não usado");
  }
  async updateStatus(orgId: string, postId: string, status: PostStatus): Promise<Post | null> {
    if (!this.post || this.post.id !== postId || this.post.orgId !== orgId) return null;
    this.post = { ...this.post, status };
    return this.post;
  }
  async delete(): Promise<boolean> {
    throw new Error("não usado");
  }
  async listForCalendar(): Promise<CalendarPost[]> {
    throw new Error("não usado");
  }
}

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: "post-1",
    orgId: "org-1",
    projectId: "project-1",
    scheduledAt: now,
    status: "scheduled",
    channelTargets: ["export"],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("UpdatePostStatusUseCase (bloco 10)", () => {
  it("marca o post como publicado", async () => {
    const posts = new FakePostRepository(makePost());
    const result = await new UpdatePostStatusUseCase(posts).execute("org-1", "post-1", "published");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("published");
  });

  it("retorna erro quando o post não existe", async () => {
    const posts = new FakePostRepository(null);
    const result = await new UpdatePostStatusUseCase(posts).execute("org-1", "post-inexistente", "published");
    expect(result.ok).toBe(false);
  });
});
