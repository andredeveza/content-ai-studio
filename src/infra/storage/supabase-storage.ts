import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoragePort, UploadInput } from "@/core/domain/ports/storage";
import type { Database } from "@/infra/db/supabase/types";

// Sobe com service_role: os buckets usados aqui (brand-logos, media) são
// públicos para leitura (migrations 0003 e 0004), mas escrita só
// acontece pelos use-cases no servidor — mesmo raciocínio de
// SupabaseAILogger. Um bucket por instância — cada use-case injeta a sua
// (`new SupabaseStorage(db, "media")`, por exemplo).
export class SupabaseStorage implements StoragePort {
  constructor(
    private readonly db: SupabaseClient<Database>,
    private readonly bucket: string,
  ) {}

  async upload(input: UploadInput): Promise<{ path: string; publicUrl: string }> {
    const { error } = await this.db.storage.from(this.bucket).upload(input.path, input.file, {
      contentType: input.contentType,
      upsert: true,
    });

    if (error) throw error;
    return { path: input.path, publicUrl: this.getPublicUrl(input.path) };
  }

  async remove(path: string): Promise<void> {
    const { error } = await this.db.storage.from(this.bucket).remove([path]);
    if (error) throw error;
  }

  getPublicUrl(path: string): string {
    return this.db.storage.from(this.bucket).getPublicUrl(path).data.publicUrl;
  }

  async download(path: string): Promise<Buffer> {
    const { data, error } = await this.db.storage.from(this.bucket).download(path);
    if (error) throw error;
    return Buffer.from(await data.arrayBuffer());
  }
}
