import { UpdateClientSchema, type UpdateClientInput } from "@/core/application/dto/client.dto";
import type { Client } from "@/core/domain/client/client";
import type { ClientRepository } from "@/core/domain/ports/client-repository";
import { NotFoundError, ValidationError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

export class UpdateClientUseCase {
  constructor(private readonly clients: ClientRepository) {}

  async execute(orgId: string, clientId: string, input: UpdateClientInput): Promise<Result<Client, AppError>> {
    const parsed = UpdateClientSchema.safeParse(input);
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues.map((issue) => issue.message).join("; ")));
    }

    const updated = await this.clients.update(orgId, clientId, parsed.data);
    if (!updated) {
      return err(new NotFoundError(`Cliente ${clientId} não encontrado.`));
    }

    return ok(updated);
  }
}
