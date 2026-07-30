import type { ClientRepository } from "@/core/domain/ports/client-repository";
import { NotFoundError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

export class DeleteClientUseCase {
  constructor(private readonly clients: ClientRepository) {}

  async execute(orgId: string, clientId: string): Promise<Result<void, AppError>> {
    const deleted = await this.clients.delete(orgId, clientId);
    if (!deleted) {
      return err(new NotFoundError(`Cliente ${clientId} não encontrado.`));
    }
    return ok(undefined);
  }
}
