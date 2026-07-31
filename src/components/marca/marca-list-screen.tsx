"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

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
    <div className="px-4 pt-6 pb-10">
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
          className="rounded-md bg-(--chrome-ink) px-4 py-2.5 font-mono text-[11px] uppercase tracking-[.1em] text-white disabled:opacity-50"
        >
          + novo
        </button>
      </form>

      {clients.length === 0 && (
        <div className="rounded-md border border-dashed border-(--chrome-border) p-6 text-center text-sm text-(--chrome-muted)">
          Nenhum cliente cadastrado.
        </div>
      )}

      <div className="grid gap-2.5">
        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/marca/${client.id}`}
            className="rounded-[9px] border border-(--chrome-border) bg-(--chrome-surface) p-3.5 text-[15px] font-medium"
          >
            {client.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
