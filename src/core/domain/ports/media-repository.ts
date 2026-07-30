import type { Media, NewMedia } from "@/core/domain/media/media";

export interface MediaRepository {
  create(input: NewMedia): Promise<Media>;
  findById(orgId: string, mediaId: string): Promise<Media | null>;
}
