import type { BrandKit } from "@/core/domain/brandkit/brand-kit";
import type { BrandKitRepository } from "@/core/domain/ports/brand-kit-repository";
import type { ClientRepository } from "@/core/domain/ports/client-repository";
import type { StoragePort } from "@/core/domain/ports/storage";
import { NotFoundError, ValidationError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

export interface UploadBrandLogoInput {
  readonly file: Buffer;
  readonly contentType: string;
}

export class UploadBrandLogoUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly brandKits: BrandKitRepository,
    private readonly storage: StoragePort,
  ) {}

  async execute(orgId: string, clientId: string, input: UploadBrandLogoInput): Promise<Result<BrandKit, AppError>> {
    const extension = ALLOWED_CONTENT_TYPES[input.contentType];
    if (!extension) {
      return err(
        new ValidationError(
          `Tipo de arquivo "${input.contentType}" não suportado. Use PNG, JPEG, WEBP ou SVG.`,
        ),
      );
    }

    const client = await this.clients.findById(orgId, clientId);
    if (!client) {
      return err(new NotFoundError(`Cliente ${clientId} não encontrado.`));
    }

    const path = `${orgId}/${clientId}/logo.${extension}`;
    const uploaded = await this.storage.upload({ path, file: input.file, contentType: input.contentType });

    const brandKit = await this.brandKits.setLogoPath(clientId, uploaded.path);
    if (!brandKit) {
      return err(new NotFoundError(`Brand kit do cliente ${clientId} não encontrado.`));
    }

    return ok(brandKit);
  }
}
