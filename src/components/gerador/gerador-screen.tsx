"use client";

import { useId, useState, useTransition } from "react";
import { GraduationCap, Award, TrendingUp, ShieldQuestion, Smartphone, Square, RectangleVertical, Sparkles, Loader2 } from "lucide-react";
import type { ProjectGoal, ProjectRatio } from "@/core/domain/project/project";
import { ScreenContainer } from "@/components/chrome/screen-container";
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

const GOAL_OPTIONS: readonly { value: ProjectGoal; label: string; icon: typeof GraduationCap }[] = [
  { value: "educar", label: "Educar", icon: GraduationCap },
  { value: "autoridade", label: "Construir autoridade", icon: Award },
  { value: "converter", label: "Converter em venda", icon: TrendingUp },
  { value: "mito", label: "Quebrar objeção", icon: ShieldQuestion },
];

// ADENDO-02, "Defeito 2, correção 4": os 3 formatos do README (4:5,
// 1:1, 9:16 Story), como seletor único de verdade — value do
// `<input type="radio">` garante exclusividade estrutural, não só
// visual (o bug reportado era exatamente parecer 2 checkboxes
// independentes em vez de 1 escolha).
const RATIO_OPTIONS: readonly { value: ProjectRatio; label: string; icon: typeof Smartphone }[] = [
  { value: "4:5", label: "4:5 (retrato)", icon: Smartphone },
  { value: "1:1", label: "1:1 (quadrado)", icon: Square },
  { value: "9:16", label: "9:16 (story)", icon: RectangleVertical },
];

export function GeradorScreen({ clients, generateAction }: GeradorScreenProps) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [theme, setTheme] = useState("");
  const [goal, setGoal] = useState<ProjectGoal>("educar");
  const [slideCount, setSlideCount] = useState(7);
  const [ratio, setRatio] = useState<ProjectRatio>("4:5");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startAction] = useTransition();
  const ratioGroupName = useId();

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
    <ScreenContainer width="form" className="pt-6 pb-10">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex size-9 flex-none items-center justify-center rounded-xl bg-linear-to-br from-[#0A47A8] via-[#1C7ED6] to-[#57A8FF] text-white">
          <Sparkles className="size-4.5" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-[22px] font-bold tracking-[-.02em] leading-[1.1]">Gerador</h1>
          <p className="text-sm text-(--chrome-muted)">Descreva o tema e a IA monta o carrossel inteiro.</p>
        </div>
      </div>

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
            {GOAL_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGoal(option.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm",
                    goal === option.value
                      ? "border-(--chrome-ink) bg-(--chrome-ink) text-white"
                      : "border-(--chrome-border) bg-(--chrome-surface) text-(--chrome-text)",
                  )}
                >
                  <Icon className="size-4 flex-none" strokeWidth={1.75} />
                  {option.label}
                </button>
              );
            })}
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

        <fieldset className="grid gap-1.5">
          <legend className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">Formato</legend>
          <div className="grid grid-cols-3 gap-2">
            {RATIO_OPTIONS.map((option) => {
              const Icon = option.icon;
              const inputId = `${ratioGroupName}-${option.value}`;
              return (
                <label
                  key={option.value}
                  htmlFor={inputId}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1.5 rounded-md border px-2 py-2.5 text-center text-[12.5px]",
                    ratio === option.value
                      ? "border-(--chrome-ink) bg-(--chrome-ink) text-white"
                      : "border-(--chrome-border) bg-(--chrome-surface) text-(--chrome-text)",
                  )}
                >
                  <input
                    id={inputId}
                    type="radio"
                    name={ratioGroupName}
                    value={option.value}
                    checked={ratio === option.value}
                    onChange={() => setRatio(option.value)}
                    className="sr-only"
                  />
                  <Icon className="size-4" strokeWidth={1.75} />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={isPending || clients.length === 0}
          className="mt-2 flex items-center justify-center gap-2 rounded-md bg-(--chrome-ink) px-4 py-3 text-center font-mono text-[12px] uppercase tracking-widest text-white disabled:opacity-50"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isPending ? "Gerando carrossel..." : "Gerar carrossel"}
        </button>
      </form>
    </ScreenContainer>
  );
}
