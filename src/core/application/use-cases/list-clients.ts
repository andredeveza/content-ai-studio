import type { Client } from "@/core/domain/client/client";
import type { ClientRepository } from "@/core/domain/ports/client-repository";

export class ListClientsUseCase {
  constructor(private readonly clients: ClientRepository) {}

  async execute(orgId: string): Promise<Client[]> {
    return this.clients.listByOrg(orgId);
  }
}
