import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BrandKit,
  BrandKitChrome,
  BrandKitFonts,
  BrandKitPalette,
  BrandKitRules,
  NewBrandKit,
} from "@/core/domain/brandkit/brand-kit";
import type { BrandKitRepository } from "@/core/domain/ports/brand-kit-repository";
import type { Database, Json } from "@/infra/db/supabase/types";

type BrandKitRow = Database["public"]["Tables"]["brandkits"]["Row"];

function toDomain(row: BrandKitRow): BrandKit {
  return {
    id: row.id,
    clientId: row.client_id,
    palette: row.palette as unknown as BrandKitPalette,
    gradient: row.gradient,
    fonts: row.fonts as unknown as BrandKitFonts,
    logo: { path: row.logo_path, radius: row.logo_radius },
    chrome: row.chrome as unknown as BrandKitChrome,
    rules: row.rules as unknown as BrandKitRules,
    imageStyle: row.image_style,
    cta: row.cta,
    style: row.style,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseBrandKitRepository implements BrandKitRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async findByClientId(clientId: string): Promise<BrandKit | null> {
    const { data, error } = await this.db
      .from("brandkits")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();

    if (error) throw error;
    return data ? toDomain(data) : null;
  }

  async upsert(clientId: string, input: NewBrandKit): Promise<BrandKit> {
    const { data, error } = await this.db
      .from("brandkits")
      .upsert(
        {
          client_id: clientId,
          palette: input.palette as unknown as Json,
          gradient: input.gradient,
          fonts: input.fonts as unknown as Json,
          ...(input.logo && { logo_path: input.logo.path, logo_radius: input.logo.radius }),
          chrome: input.chrome as unknown as Json,
          rules: input.rules as unknown as Json,
          image_style: input.imageStyle ?? null,
          cta: input.cta,
          style: input.style ?? null,
        },
        { onConflict: "client_id" },
      )
      .select("*")
      .single();

    if (error) throw error;
    return toDomain(data);
  }

  async setLogoPath(clientId: string, logoPath: string): Promise<BrandKit | null> {
    const { data, error } = await this.db
      .from("brandkits")
      .update({ logo_path: logoPath })
      .eq("client_id", clientId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? toDomain(data) : null;
  }
}
