import type { BrandKit } from "@/core/domain/brandkit/brand-kit";
import type { BrandKitRepository } from "@/core/domain/ports/brand-kit-repository";
import type { ClientRepository } from "@/core/domain/ports/client-repository";
import { NotFoundError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

export class GetBrandKitUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly brandKits: BrandKitRepository,
  ) {}

  async execute(orgId: string, clientId: string): Promise<Result<BrandKit, AppError>> {
    const client = await this.clients.findById(orgId, clientId);
    if (!client) {
      return err(new NotFoundError(`Cliente ${clientId} não encontrado.`));
    }

    const brandKit = await this.brandKits.findByClientId(clientId);
    if (!brandKit) {
      return err(new NotFoundError(`Brand kit do cliente ${clientId} não encontrado.`));
    }

    return ok(brandKit);
  }
}
