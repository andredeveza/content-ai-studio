"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ChevronRight, Globe, Plus } from "lucide-react";
import { ScreenContainer } from "@/components/chrome/screen-container";
import { cn } from "@/lib/utils";

export interface MarcaClientData {
  readonly id: string;
  readonly name: string;
  readonly hasSite: boolean;
}

export interface MarcaListScreenProps {
  readonly clients: readonly MarcaClientData[];
  readonly createClientAction: (
    name: string,
  ) => Promise<{ ok: true; clientId: string } | { ok: false; error: string }>;
}

const AVATAR_GRADIENTS = [
  "from-[#0A47A8] to-[#57A8FF]",
  "from-[#7C3AED] to-[#EC4899]",
  "from-[#0EA5E9] to-[#22D3EE]",
  "from-[#F97316] to-[#FACC15]",
];

function avatarGradient(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]!;
}

export function MarcaListScreen({ clients: initialClients, createClientAction }: MarcaListScreenProps) {
  const [clients, setClients] = useState(initialClients);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startAction] = useTransition();

  function handleCreate(event: React.FormEvent): void {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    startAction(async () => {
      const result = await createClientAction(name.trim());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setClients((prev) => [...prev, { id: result.clientId, name: name.trim(), hasSite: false }]);
      setName("");
    });
  }

  return (
    <ScreenContainer width="wide" className="pt-6 pb-10">
      <h1 className="mb-1 text-[28px] font-bold tracking-[-.03em] leading-[1.1]">Marca</h1>
      <p className="mb-6 text-sm text-(--chrome-muted)">Clientes e brand kits.</p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do cliente"
          className="flex-1 rounded-md border border-(--chrome-border) bg-(--chrome-surface) px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-md bg-(--chrome-ink) px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-white disabled:opacity-50"
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
          novo
        </button>
      </form>

      {clients.length === 0 && (
        <div className="relative h-40 overflow-hidden rounded-2xl border border-(--chrome-border)">
          <Image src="/brand/empty-brand.jpg" alt="" aria-hidden="true" fill sizes="480px" className="object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-sm font-medium text-white">Nenhum cliente cadastrado.</p>
            <p className="mt-1 text-xs text-white/70">Cadastre um cliente e monte o brand kit acima.</p>
          </div>
        </div>
      )}

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/marca/${client.id}`}
            className="flex items-center gap-3 rounded-[9px] border border-(--chrome-border) bg-(--chrome-surface) p-3.5 transition-colors active:bg-(--chrome-surface-2)"
          >
            <div
              className={cn(
                "flex size-9 flex-none items-center justify-center rounded-full bg-linear-to-br text-sm font-semibold text-white",
                avatarGradient(client.name),
              )}
            >
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-medium">{client.name}</div>
              {client.hasSite && (
                <div className="mt-0.5 flex items-center gap-1 text-[10.5px] text-(--chrome-muted)">
                  <Globe className="size-3" />
                  site cadastrado
                </div>
              )}
            </div>
            <ChevronRight className="size-4 flex-none text-(--chrome-faint)" />
          </Link>
        ))}
      </div>
    </ScreenContainer>
  );
}
