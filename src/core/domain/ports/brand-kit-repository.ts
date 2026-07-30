import type { BrandKit, NewBrandKit } from "@/core/domain/brandkit/brand-kit";

export interface BrandKitRepository {
  findByClientId(clientId: string): Promise<BrandKit | null>;
  upsert(clientId: string, input: NewBrandKit): Promise<BrandKit>;
  setLogoPath(clientId: string, logoPath: string): Promise<BrandKit | null>;
}
