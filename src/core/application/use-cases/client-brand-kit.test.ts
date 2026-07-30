import { describe, expect, it } from "vitest";
import { CreateClientUseCase } from "@/core/application/use-cases/create-client";
import { UpdateClientUseCase } from "@/core/application/use-cases/update-client";
import { GetClientUseCase } from "@/core/application/use-cases/get-client";
import { ListClientsUseCase } from "@/core/application/use-cases/list-clients";
import { DeleteClientUseCase } from "@/core/application/use-cases/delete-client";
import { UpsertBrandKitUseCase } from "@/core/application/use-cases/upsert-brand-kit";
import { GetBrandKitUseCase } from "@/core/application/use-cases/get-brand-kit";
import { UploadBrandLogoUseCase } from "@/core/application/use-cases/upload-brand-logo";
import type { Client, ClientPatch, NewClient } from "@/core/domain/client/client";
import type { ClientRepository } from "@/core/domain/ports/client-repository";
import type { BrandKit, NewBrandKit } from "@/core/domain/brandkit/brand-kit";
import type { BrandKitRepository } from "@/core/domain/ports/brand-kit-repository";
import type { StoragePort, UploadInput } from "@/core/domain/ports/storage";

class InMemoryClientRepository implements ClientRepository {
  private readonly rows = new Map<string, Client>();
  private seq = 0;

  async findById(orgId: string, clientId: string): Promise<Client | null> {
    const row = this.rows.get(clientId);
    return row && row.orgId === orgId ? row : null;
  }

  async listByOrg(orgId: string): Promise<Client[]> {
    return [...this.rows.values()].filter((row) => row.orgId === orgId);
  }

  async create(input: NewClient): Promise<Client> {
    this.seq += 1;
    const now = new Date(2026, 0, 1).toISOString();
    const client: Client = {
      id: `client-${this.seq}`,
      orgId: input.orgId,
      name: input.name,
      handles: input.handles ?? [],
      persona: input.persona ?? null,
      tone: input.tone ?? [],
      goals: input.goals ?? [],
      specialties: input.specialties ?? [],
      site: input.site ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(client.id, client);
    return client;
  }

  async update(orgId: string, clientId: string, patch: ClientPatch): Promise<Client | null> {
    const existing = await this.findById(orgId, clientId);
    if (!existing) return null;
    const updated: Client = { ...existing, ...patch };
    this.rows.set(clientId, updated);
    return updated;
  }

  async delete(orgId: string, clientId: string): Promise<boolean> {
    const existing = await this.findById(orgId, clientId);
    if (!existing) return false;
    return this.rows.delete(clientId);
  }
}

class InMemoryBrandKitRepository implements BrandKitRepository {
  private readonly rows = new Map<string, BrandKit>();

  async findByClientId(clientId: string): Promise<BrandKit | null> {
    return this.rows.get(clientId) ?? null;
  }

  async upsert(clientId: string, input: NewBrandKit): Promise<BrandKit> {
    const now = new Date(2026, 0, 1).toISOString();
    const existing = this.rows.get(clientId);
    const brandKit: BrandKit = {
      id: existing?.id ?? `brandkit-${clientId}`,
      clientId,
      palette: input.palette,
      gradient: input.gradient,
      fonts: input.fonts,
      logo: input.logo ?? existing?.logo ?? { path: null, radius: 0 },
      chrome: input.chrome,
      rules: input.rules,
      imageStyle: input.imageStyle ?? null,
      cta: input.cta,
      style: input.style ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.rows.set(clientId, brandKit);
    return brandKit;
  }

  async setLogoPath(clientId: string, logoPath: string): Promise<BrandKit | null> {
    const existing = this.rows.get(clientId);
    if (!existing) return null;
    const updated: BrandKit = { ...existing, logo: { ...existing.logo, path: logoPath } };
    this.rows.set(clientId, updated);
    return updated;
  }
}

class InMemoryStorage implements StoragePort {
  readonly uploaded: UploadInput[] = [];

  async upload(input: UploadInput): Promise<{ path: string; publicUrl: string }> {
    this.uploaded.push(input);
    return { path: input.path, publicUrl: this.getPublicUrl(input.path) };
  }

  async remove(): Promise<void> {}

  getPublicUrl(path: string): string {
    return `https://storage.local/brand-logos/${path}`;
  }
}

const ORG_ID = "11111111-1111-4111-8111-111111111111";

// Sem anotação de tipo: os arrays literais ficam mutáveis, compatíveis
// tanto com `NewBrandKit` (campos `readonly`) quanto com o tipo de input
// (mutável) que o use-case espera — anotar como `NewBrandKit` forçaria
// `readonly number[]` e quebraria a segunda atribuição.
function validBrandKitInput() {
  return {
    palette: {
      ink: "#06070A",
      graphite: "#101319",
      slate: "#1B212B",
      gray: "#8B94A3",
      title: "#EEF1F6",
      brand: "#0A47A8",
      primary: "#1C7ED6",
      accent: "#57A8FF",
      loud: "#1C4FE0",
      bgLight: "#FFFFFF",
      panelLight: "#F4F6FA",
      titleLight: "#0A0C10",
      textLight: "#5A6474",
    },
    gradient: "linear-gradient(135deg, #0A47A8, #1C7ED6 55%, #57A8FF)",
    fonts: {
      display: { family: "Satoshi", weights: [700, 900] },
      body: { family: "General Sans", weights: [400, 500] },
      mono: { family: "JetBrains Mono", weights: [400, 500] },
    },
    chrome: {
      top: ["@trafegodigitalad", "AD TRÁFEGO DIGITAL", "©2026"],
      footer: "✦ ARRASTE PARA O LADO →",
      footerLast: "SALVE ESTE POST",
    },
    rules: { neonMaxArea: "detail" as const, alternateModes: true, blurTextForbidden: true as const },
    cta: "Fale com a gente",
  };
}

describe("Cliente + Brand Kit (bloco 3)", () => {
  it("cria, lista, atualiza e apaga um cliente", async () => {
    const clients = new InMemoryClientRepository();

    const created = await new CreateClientUseCase(clients).execute({ orgId: ORG_ID, name: "AD Tráfego Digital" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const clientId = created.value.id;

    const listed = await new ListClientsUseCase(clients).execute(ORG_ID);
    expect(listed).toHaveLength(1);

    const updated = await new UpdateClientUseCase(clients).execute(ORG_ID, clientId, {
      handles: ["@trafegodigitalad"],
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) expect(updated.value.handles).toEqual(["@trafegodigitalad"]);

    const fetched = await new GetClientUseCase(clients).execute(ORG_ID, clientId);
    expect(fetched.ok).toBe(true);

    const deleted = await new DeleteClientUseCase(clients).execute(ORG_ID, clientId);
    expect(deleted.ok).toBe(true);

    const afterDelete = await new GetClientUseCase(clients).execute(ORG_ID, clientId);
    expect(afterDelete.ok).toBe(false);
  });

  it("rejeita criar cliente sem nome", async () => {
    const clients = new InMemoryClientRepository();
    const result = await new CreateClientUseCase(clients).execute({ orgId: ORG_ID, name: "  " });
    expect(result.ok).toBe(false);
  });

  it("não atualiza cliente de outra org (isolamento multi-tenant)", async () => {
    const clients = new InMemoryClientRepository();
    const created = await new CreateClientUseCase(clients).execute({ orgId: ORG_ID, name: "AD Tráfego Digital" });
    if (!created.ok) throw new Error("setup falhou");

    const result = await new UpdateClientUseCase(clients).execute("outra-org", created.value.id, { name: "Hackeado" });
    expect(result.ok).toBe(false);
  });

  it("faz upsert do brand kit e recupera pelo cliente", async () => {
    const clients = new InMemoryClientRepository();
    const brandKits = new InMemoryBrandKitRepository();

    const created = await new CreateClientUseCase(clients).execute({ orgId: ORG_ID, name: "AD Tráfego Digital" });
    if (!created.ok) throw new Error("setup falhou");
    const clientId = created.value.id;

    const upserted = await new UpsertBrandKitUseCase(clients, brandKits).execute(
      ORG_ID,
      clientId,
      validBrandKitInput(),
    );
    expect(upserted.ok).toBe(true);
    if (upserted.ok) {
      expect(upserted.value.palette.brand).toBe("#0A47A8");
      expect(upserted.value.rules.blurTextForbidden).toBe(true);
    }

    const fetched = await new GetBrandKitUseCase(clients, brandKits).execute(ORG_ID, clientId);
    expect(fetched.ok).toBe(true);
  });

  it("rejeita brand kit com cor fora do formato hex", async () => {
    const clients = new InMemoryClientRepository();
    const brandKits = new InMemoryBrandKitRepository();
    const created = await new CreateClientUseCase(clients).execute({ orgId: ORG_ID, name: "AD Tráfego Digital" });
    if (!created.ok) throw new Error("setup falhou");

    const invalidInput = { ...validBrandKitInput(), palette: { ...validBrandKitInput().palette, ink: "azul" } };
    const result = await new UpsertBrandKitUseCase(clients, brandKits).execute(
      ORG_ID,
      created.value.id,
      invalidInput,
    );
    expect(result.ok).toBe(false);
  });

  it("faz upload do logo e associa o path ao brand kit", async () => {
    const clients = new InMemoryClientRepository();
    const brandKits = new InMemoryBrandKitRepository();
    const storage = new InMemoryStorage();

    const created = await new CreateClientUseCase(clients).execute({ orgId: ORG_ID, name: "AD Tráfego Digital" });
    if (!created.ok) throw new Error("setup falhou");
    const clientId = created.value.id;

    await new UpsertBrandKitUseCase(clients, brandKits).execute(ORG_ID, clientId, validBrandKitInput());

    const uploadUseCase = new UploadBrandLogoUseCase(clients, brandKits, storage);
    const result = await uploadUseCase.execute(ORG_ID, clientId, {
      file: Buffer.from("fake-png-bytes"),
      contentType: "image/png",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.logo.path).toBe(`${ORG_ID}/${clientId}/logo.png`);
    }
    expect(storage.uploaded).toHaveLength(1);
  });

  it("rejeita upload de logo com tipo de arquivo não suportado", async () => {
    const clients = new InMemoryClientRepository();
    const brandKits = new InMemoryBrandKitRepository();
    const storage = new InMemoryStorage();

    const created = await new CreateClientUseCase(clients).execute({ orgId: ORG_ID, name: "AD Tráfego Digital" });
    if (!created.ok) throw new Error("setup falhou");

    const result = await new UploadBrandLogoUseCase(clients, brandKits, storage).execute(ORG_ID, created.value.id, {
      file: Buffer.from("conteudo"),
      contentType: "application/pdf",
    });

    expect(result.ok).toBe(false);
    expect(storage.uploaded).toHaveLength(0);
  });
});
