import type { AssetKind } from "@/core/domain/asset/asset";
import type { Asset } from "@/core/domain/asset/asset";
import type { AssetRepository } from "@/core/domain/ports/asset-repository";
import type { StoragePort } from "@/core/domain/ports/storage";
import { ValidationError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

export interface IngestAssetInput {
  readonly orgId: string;
  readonly clientId: string;
  // Identificador único do upload (ex.: crypto.randomUUID()) — decidido
  // por quem chama, igual ao `key` de RenderSlideInput (bloco 5).
  readonly key: string;
  readonly filename: string;
  readonly mime: string;
  readonly file: Buffer;
}

const FONT_EXTENSION_REGEX = /\.(ttf|otf|woff2?)$/i;

// README, "Ingestão": PNG, JPG, WEBP, PDF, TTF/OTF/WOFF2.
export function detectAssetKind(mime: string, filename: string): AssetKind | null {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf" || /\.pdf$/i.test(filename)) return "pdf";
  if (FONT_EXTENSION_REGEX.test(filename)) return "font";
  return null;
}

// Step 1 do fluxo do Acervo (README: "ingestão → extração → indexação →
// recuperação"). Só sobe o arquivo e grava `assets` com status
// `pending` — a extração roda depois, em AnalyzeAssetUseCase.
export class IngestAssetUseCase {
  constructor(
    private readonly assets: AssetRepository,
    private readonly storage: StoragePort,
  ) {}

  async execute(input: IngestAssetInput): Promise<Result<Asset, AppError>> {
    const kind = detectAssetKind(input.mime, input.filename);
    if (!kind) {
      return err(new ValidationError(`Formato não suportado: ${input.filename}`));
    }

    const path = `${input.orgId}/${input.clientId}/${input.key}/${input.filename}`;
    const uploaded = await this.storage.upload({ path, file: input.file, contentType: input.mime });

    const asset = await this.assets.create({
      orgId: input.orgId,
      clientId: input.clientId,
      path: uploaded.path,
      mime: input.mime,
      kind,
    });

    return ok(asset);
  }
}
