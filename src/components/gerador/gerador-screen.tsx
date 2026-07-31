"use client";

import { useState, useTransition } from "react";
import type { ProjectGoal, ProjectRatio } from "@/core/domain/project/project";
import { cn } from "@/lib/utils";

export interface GeradorClientOption {
  readonly id: string;
  readonly name: string;
}

export interface GeradorScreenProps {
  readonly clients: readonly GeradorClientOption[];
  readonly generateAction: (input: {
    clientId: string;
    theme: string;
    goal: ProjectGoal;
    slideCount: number;
    ratio: ProjectRatio;
  }) => Promise<{ ok: false; error: string } | void>;
}

const GOAL_OPTIONS: readonly { value: ProjectGoal; label: string }[] = [
  { value: "educar", label: "Educar" },
  { value: "autoridade", label: "Construir autoridade" },
  { value: "converter", label: "Converter em venda" },
  { value: "mito", label: "Quebrar objeção" },
];

const RATIO_OPTIONS: readonly { value: ProjectRatio; label: string }[] = [
  { value: "4:5", label: "4:5 (retrato)" },
  { value: "1:1", label: "1:1 (quadrado)" },
];

export function GeradorScreen({ clients, generateAction }: GeradorScreenProps) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [theme, setTheme] = useState("");
  const [goal, setGoal] = useState<ProjectGoal>("educar");
  const [slideCount, setSlideCount] = useState(7);
  const [ratio, setRatio] = useState<ProjectRatio>("4:5");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startAction] = useTransition();

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    setError(null);

    if (!clientId) {
      setError("Cadastre um cliente em Marca antes de gerar um carrossel.");
      return;
    }
    if (!theme.trim()) {
      setError("Tema é obrigatório.");
      return;
    }

    startAction(async () => {
      const result = await generateAction({ clientId, theme: theme.trim(), goal, slideCount, ratio });
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="mb-1 text-[28px] font-bold tracking-[-.03em] leading-[1.1]">Gerador</h1>
      <p className="mb-6 text-sm text-(--chrome-muted)">Descreva o tema e a IA monta o carrossel inteiro.</p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5">
        <label className="grid gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">Cliente</span>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="rounded-md border border-(--chrome-border) bg-(--chrome-surface) px-3 py-2.5 text-sm"
          >
            {clients.length === 0 && <option value="">Nenhum cliente cadastrado</option>}
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">Tema</span>
          <textarea
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            rows={3}
            placeholder="Ex.: 5 erros que travam o crescimento de uma clínica no Instagram"
            className="resize-none rounded-md border border-(--chrome-border) bg-(--chrome-surface) px-3 py-2.5 text-sm"
          />
        </label>

        <div className="grid gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">Objetivo</span>
          <div className="grid grid-cols-2 gap-2">
            {GOAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setGoal(option.value)}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-left text-sm",
                  goal === option.value
                    ? "border-(--chrome-ink) bg-(--chrome-ink) text-white"
                    : "border-(--chrome-border) bg-(--chrome-surface) text-(--chrome-text)",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="grid gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">
            Quantidade de slides ({slideCount})
          </span>
          <input
            type="range"
            min={6}
            max={8}
            step={1}
            value={slideCount}
            onChange={(e) => setSlideCount(Number(e.target.value))}
          />
        </label>

        <div className="grid gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">Formato</span>
          <div className="grid grid-cols-2 gap-2">
            {RATIO_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRatio(option.value)}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-sm",
                  ratio === option.value
                    ? "border-(--chrome-ink) bg-(--chrome-ink) text-white"
                    : "border-(--chrome-border) bg-(--chrome-surface) text-(--chrome-text)",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || clients.length === 0}
          className="mt-2 rounded-md bg-(--chrome-ink) px-4 py-3 text-center font-mono text-[12px] uppercase tracking-[.1em] text-white disabled:opacity-50"
        >
          {isPending ? "Gerando carrossel..." : "Gerar carrossel"}
        </button>
      </form>
    </div>
  );
}
