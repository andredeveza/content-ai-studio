import type { Client } from "@/core/domain/client/client";
import type { ClientRepository } from "@/core/domain/ports/client-repository";
import { NotFoundError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

export class GetClientUseCase {
  constructor(private readonly clients: ClientRepository) {}

  async execute(orgId: string, clientId: string): Promise<Result<Client, AppError>> {
    const client = await this.clients.findById(orgId, clientId);
    if (!client) {
      return err(new NotFoundError(`Cliente ${clientId} não encontrado.`));
    }
    return ok(client);
  }
}
