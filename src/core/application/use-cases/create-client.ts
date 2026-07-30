import { CreateClientSchema, type CreateClientInput } from "@/core/application/dto/client.dto";
import type { Client } from "@/core/domain/client/client";
import type { ClientRepository } from "@/core/domain/ports/client-repository";
import { ValidationError, type AppError } from "@/shared/errors";
import { err, ok, type Result } from "@/shared/result";

export class CreateClientUseCase {
  constructor(private readonly clients: ClientRepository) {}

  async execute(input: CreateClientInput): Promise<Result<Client, AppError>> {
    const parsed = CreateClientSchema.safeParse(input);
    if (!parsed.success) {
      return err(new ValidationError(parsed.error.issues.map((issue) => issue.message).join("; ")));
    }

    const client = await this.clients.create(parsed.data);
    return ok(client);
  }
}
