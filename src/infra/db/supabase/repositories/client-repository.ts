import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Client, ClientPatch, NewClient } from "@/core/domain/client/client";
import type { ClientRepository } from "@/core/domain/ports/client-repository";
import type { Database } from "@/infra/db/supabase/types";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

function toDomain(row: ClientRow): Client {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    handles: row.handles,
    persona: row.persona,
    tone: row.tone,
    goals: row.goals,
    specialties: row.specialties,
    site: row.site,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseClientRepository implements ClientRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async findById(orgId: string, clientId: string): Promise<Client | null> {
    const { data, error } = await this.db
      .from("clients")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", clientId)
      .maybeSingle();

    if (error) throw error;
    return data ? toDomain(data) : null;
  }

  async listByOrg(orgId: string): Promise<Client[]> {
    const { data, error } = await this.db
      .from("clients")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(toDomain);
  }

  async create(input: NewClient): Promise<Client> {
    const { data, error } = await this.db
      .from("clients")
      .insert({
        org_id: input.orgId,
        name: input.name,
        handles: [...(input.handles ?? [])],
        persona: input.persona ?? null,
        tone: [...(input.tone ?? [])],
        goals: [...(input.goals ?? [])],
        specialties: [...(input.specialties ?? [])],
        site: input.site ?? null,
      })
      .select("*")
      .single();

    if (error) throw error;
    return toDomain(data);
  }

  async update(orgId: string, clientId: string, patch: ClientPatch): Promise<Client | null> {
    const { data, error } = await this.db
      .from("clients")
      .update({
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.handles !== undefined && { handles: [...patch.handles] }),
        ...(patch.persona !== undefined && { persona: patch.persona }),
        ...(patch.tone !== undefined && { tone: [...patch.tone] }),
        ...(patch.goals !== undefined && { goals: [...patch.goals] }),
        ...(patch.specialties !== undefined && { specialties: [...patch.specialties] }),
        ...(patch.site !== undefined && { site: patch.site }),
      })
      .eq("org_id", orgId)
      .eq("id", clientId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? toDomain(data) : null;
  }

  async delete(orgId: string, clientId: string): Promise<boolean> {
    const { data, error } = await this.db
      .from("clients")
      .delete()
      .eq("org_id", orgId)
      .eq("id", clientId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  }
}
