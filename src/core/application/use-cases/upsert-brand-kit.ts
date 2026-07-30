import { UpsertBrandKitSchema, type UpsertBrandKitInput } from "@/core/application/dto/brand-kit.dto";
import type { BrandKit } from "@/core/domain/brandkit/brand-kit";
import type { BrandKitRepository } from "@/core/domain/ports/brand-kit-repository";
import type { ClientRepository } from "@/core/domain/ports/client-repository";
import { NotFoundError, ValidationError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

export class UpsertBrandKitUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly brandKits: BrandKitRepository,
  ) {}

  async execute(orgId: string, clientId: string, input: UpsertBrandKitInput): Promise<Result<BrandKit, AppError>> {
    const parsed = UpsertBrandKitSchema.safeParse(input);
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues.map((issue) => issue.message).join("; ")));
    }

    const client = await this.clients.findById(orgId, clientId);
    if (!client) {
      return err(new NotFoundError(`Cliente ${clientId} não encontrado.`));
    }

    const brandKit = await this.brandKits.upsert(clientId, parsed.data);
    return ok(brandKit);
  }
}
