import type { Client, ClientPatch, NewClient } from "@/core/domain/client/client";

export interface ClientRepository {
  findById(orgId: string, clientId: string): Promise<Client | null>;
  listByOrg(orgId: string): Promise<Client[]>;
  create(input: NewClient): Promise<Client>;
  update(orgId: string, clientId: string, patch: ClientPatch): Promise<Client | null>;
  delete(orgId: string, clientId: string): Promise<boolean>;
}
