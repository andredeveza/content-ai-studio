"use client";

import { useId, useState, useTransition } from "react";
import { Loader2, Lock, Sparkles } from "lucide-react";
import type { ProjectGoal, ProjectRatio } from "@/core/domain/project/project";
import { BlinkingCursor } from "@/components/brand/logo-mark";
import { ScreenContainer } from "@/components/chrome/screen-container";
import { DEFAULT_STYLE_SLUG } from "@/core/domain/template/composition-styles.catalog";
import { cn } from "@/lib/utils";

export interface GeradorStyleAvailability {
  readonly id: string;
  readonly available: boolean;
  readonly reason: string | null;
}

export interface GeradorClientOption {
  readonly id: string;
  readonly name: string;
  // Cobertura de estilos avaliada contra o acervo DESTE cliente.
  readonly styles: readonly GeradorStyleAvailability[];
}

export interface GeradorStyleOption {
  readonly id: string;
  readonly name: string;
  readonly sourceRef: string;
  readonly format: "carousel" | "single";
}

export interface GeradorScreenProps {
  readonly clients: readonly GeradorClientOption[];
  readonly styles: readonly GeradorStyleOption[];
  readonly generateAction: (input: {
    clientId: string;
    theme: string;
    goal: ProjectGoal;
    slideCount: number;
    ratio: ProjectRatio;
    styleId: string;
    format: "carousel" | "single";
    cta: string;
  }) => Promise<{ ok: false; error: string } | void>;
}

// Protótipo mobile, bloco "objetivo": lista de rádios com bolinha
// desenhada à mão (15px de anel, 8px de miolo), não botões com ícone.
const GOAL_OPTIONS: readonly { value: ProjectGoal; label: string }[] = [
  { value: "educar", label: "Educar" },
  { value: "autoridade", label: "Construir autoridade" },
  { value: "converter", label: "Converter em venda" },
  { value: "mito", label: "Quebrar objeção" },
];

const RATIO_OPTIONS: readonly { value: ProjectRatio; label: string; bar: string }[] = [
  { value: "4:5", label: "4:5", bar: "h-8" },
  { value: "1:1", label: "1:1", bar: "h-6.5" },
  { value: "9:16", label: "9:16", bar: "h-11" },
];

// Chips de sugestão do protótipo (carrossel horizontal, Mono 11px,
// pílula de 44px). Preenchem o campo de tema com um clique.
const SUGGESTIONS = [
  "custo do lead alto padrão",
  "tráfego ou venda?",
  "erros no cardápio digital",
  "3 mitos sobre anúncio",
];

const SECTION_LABEL = "font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted) mb-2.5";

export function GeradorScreen({ clients, styles, generateAction }: GeradorScreenProps) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [styleId, setStyleId] = useState(DEFAULT_STYLE_SLUG);
  const [theme, setTheme] = useState("");
  const [goal, setGoal] = useState<ProjectGoal>("educar");
  const [slideCount, setSlideCount] = useState(7);
  const [ratio, setRatio] = useState<ProjectRatio>("4:5");
  const [cta, setCta] = useState("Fale com a gente");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startAction] = useTransition();
  const ratioGroupName = useId();
  const styleGroupName = useId();
  const goalGroupName = useId();

  const selectedClient = clients.find((client) => client.id === clientId);
  const availabilityFor = (id: string) => selectedClient?.styles.find((style) => style.id === id);
  const selectedStyle = styles.find((style) => style.id === styleId);
  const isSingle = selectedStyle?.format === "single";
  // Post único não é "carrossel com 1 slide": o corpo vive na legenda.
  const effectiveSlideCount = isSingle ? 1 : slideCount;

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

    const availability = availabilityFor(styleId);
    if (availability && !availability.available) {
      setError(availability.reason ?? "Este estilo ainda não está disponível para este cliente.");
      return;
    }

    startAction(async () => {
      const result = await generateAction({
        clientId,
        theme: theme.trim(),
        goal,
        slideCount: effectiveSlideCount,
        ratio,
        styleId,
        format: isSingle ? "single" : "carousel",
        cta: cta.trim(),
      });
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <ScreenContainer width="form" className="pt-7 pb-10">
      <h1 className="mb-2.5 text-[32px] leading-[1.06] font-bold tracking-[-.03em] text-pretty">
        Sobre o que vamos falar?
      </h1>
      <p className="mb-6 text-[14.5px] leading-[1.55] text-(--chrome-text)">
        Informe o tema. Pesquisa, texto, imagens, legenda e hashtags saem daqui — no brand kit do cliente.
      </p>

      {error && (
        <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Prompt em foco: `>` verde #3A9A48 Mono 17px + cursor piscando.
            É a assinatura da tela no handoff. */}
        <div className="mb-2.5 flex items-center gap-2.5 rounded-xl border border-(--chrome-border) bg-(--chrome-surface) px-3.5 py-1">
          <span className="flex-none font-mono text-[17px] text-(--chrome-ok)">&gt;</span>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="ex.: como anunciar no Meta Ads em 2026"
            aria-label="Tema"
            className="min-w-0 flex-1 border-none bg-transparent py-3.5 text-base text-(--chrome-ink) outline-none"
          />
          <BlinkingCursor className="h-5 w-2 flex-none" />
        </div>

        <div className="noscroll -mx-4 mb-7 flex gap-1.75 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setTheme(suggestion)}
              className="min-h-11 flex-none rounded-full border border-(--chrome-border) bg-transparent px-3.5 py-3 font-mono text-[11px] whitespace-nowrap text-(--chrome-text)"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className={SECTION_LABEL}>cliente</div>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          aria-label="Cliente"
          className="mb-7 min-h-12 w-full rounded-[10px] border border-(--chrome-border) bg-(--chrome-surface) px-3.5 text-[15px]"
        >
          {clients.length === 0 && <option value="">Nenhum cliente cadastrado</option>}
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>

        <fieldset className="mb-7">
          <legend className={SECTION_LABEL}>objetivo</legend>
          <div className="grid gap-1.5">
            {GOAL_OPTIONS.map((option) => {
              const inputId = `${goalGroupName}-${option.value}`;
              const on = goal === option.value;
              return (
                <label
                  key={option.value}
                  htmlFor={inputId}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center gap-2.75 rounded-[10px] border bg-(--chrome-surface) p-3.5 text-[15px] text-(--chrome-ink)",
                    on ? "border-(--chrome-ink)" : "border-(--chrome-border)",
                  )}
                >
                  <input
                    id={inputId}
                    type="radio"
                    name={goalGroupName}
                    value={option.value}
                    checked={on}
                    onChange={() => setGoal(option.value)}
                    className="sr-only"
                  />
                  <span className="flex size-[15px] flex-none items-center justify-center rounded-full border border-(--chrome-faint)">
                    {on && <span className="size-2 rounded-full bg-(--chrome-ink)" />}
                  </span>
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        {!isSingle && (
          <>
            <div className={SECTION_LABEL}>slides</div>
            {/* Stepper com botões 44×44 — o README exige alvo de toque
                mínimo de 44px "sem exceção". Antes era um <input range>. */}
            <div className="mb-6 flex items-center gap-3.5 rounded-[10px] border border-(--chrome-border) bg-(--chrome-surface) px-3 py-2">
              <button
                type="button"
                onClick={() => setSlideCount((n) => Math.max(6, n - 1))}
                disabled={slideCount <= 6}
                aria-label="Menos slides"
                className="size-11 rounded-lg border border-(--chrome-border) bg-(--chrome-surface-2) text-xl text-(--chrome-ink) disabled:opacity-40"
              >
                −
              </button>
              <div aria-live="polite" className="flex-1 text-center font-mono text-[19px]">
                {slideCount}
              </div>
              <button
                type="button"
                onClick={() => setSlideCount((n) => Math.min(8, n + 1))}
                disabled={slideCount >= 8}
                aria-label="Mais slides"
                className="size-11 rounded-lg border border-(--chrome-border) bg-(--chrome-surface-2) text-xl text-(--chrome-ink) disabled:opacity-40"
              >
                +
              </button>
            </div>
          </>
        )}

        <div className={SECTION_LABEL}>cta</div>
        <input
          value={cta}
          onChange={(e) => setCta(e.target.value)}
          aria-label="CTA"
          className="mb-6 w-full rounded-[10px] border border-(--chrome-border) bg-(--chrome-surface) px-3.5 py-3.75 text-[15px] text-(--chrome-ink)"
        />

        <fieldset className="mb-6">
          <legend className={SECTION_LABEL}>formato</legend>
          <div className="flex gap-2">
            {RATIO_OPTIONS.map((option) => {
              const inputId = `${ratioGroupName}-${option.value}`;
              const on = ratio === option.value;
              return (
                <label key={option.value} htmlFor={inputId} className="flex-1 cursor-pointer">
                  <input
                    id={inputId}
                    type="radio"
                    name={ratioGroupName}
                    value={option.value}
                    checked={on}
                    onChange={() => setRatio(option.value)}
                    className="sr-only"
                  />
                  {/* Card de 84px com a barra proporcional ao formato —
                      mesma linguagem dos cards de template do protótipo. */}
                  <div
                    className={cn(
                      "flex h-21 items-end justify-center rounded-[9px] border bg-(--chrome-surface) p-2.25",
                      on ? "border-(--chrome-ink)" : "border-(--chrome-border)",
                    )}
                  >
                    <div className={cn("w-7 rounded-sm bg-(--chrome-border)", option.bar)} />
                  </div>
                  <div className="mt-1.5 text-center font-mono text-[10px] text-(--chrome-muted)">{option.label}</div>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mb-6">
          <legend className={SECTION_LABEL}>estilo de composição</legend>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {styles.map((style) => {
              const availability = availabilityFor(style.id);
              const blocked = availability ? !availability.available : false;
              const inputId = `${styleGroupName}-${style.id}`;
              const on = styleId === style.id;
              return (
                <label
                  key={style.id}
                  htmlFor={inputId}
                  title={blocked ? (availability?.reason ?? undefined) : undefined}
                  className={cn(
                    "flex min-h-12 flex-col justify-center gap-0.5 rounded-[10px] border bg-(--chrome-surface) p-3.5",
                    blocked ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                    on && !blocked ? "border-(--chrome-ink)" : "border-(--chrome-border)",
                  )}
                >
                  <input
                    id={inputId}
                    type="radio"
                    name={styleGroupName}
                    value={style.id}
                    checked={on}
                    disabled={blocked}
                    onChange={() => setStyleId(style.id)}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-1.5 text-[15px] text-(--chrome-ink)">
                    {blocked && <Lock className="size-3.5 flex-none" strokeWidth={1.4} />}
                    {style.name}
                    {style.format === "single" && (
                      <span className="rounded-full bg-(--chrome-surface-2) px-1.5 py-px font-mono text-[9px] uppercase tracking-[.1em] text-(--chrome-muted)">
                        post único
                      </span>
                    )}
                  </span>
                  {/* README: estilo bloqueado "aparece desabilitado com o
                      motivo à mostra — nunca silenciosamente ausente". */}
                  <span className="font-mono text-[10px] leading-snug text-(--chrome-muted)">
                    {blocked ? availability?.reason : style.sourceRef}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {isSingle && (
          <p className="mb-6 rounded-[10px] border border-(--chrome-border) bg-(--chrome-surface-2) px-3.5 py-3 text-[13px] text-(--chrome-text)">
            Post único: 1 imagem só, e o conteúdo inteiro vai na legenda.
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || clients.length === 0}
          className="flex min-h-13 w-full items-center justify-center gap-2.25 rounded-[10px] bg-(--chrome-terminal) p-4.25 text-[15.5px] font-semibold text-white disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="size-4.25 animate-spin" strokeWidth={1.75} />
          ) : (
            <Sparkles className="size-4.25" strokeWidth={1.75} />
          )}
          {isPending ? "Gerando..." : isSingle ? "Gerar post" : "Gerar carrossel"}
        </button>
        <div className="mt-2.25 text-center font-mono text-[10.5px] text-(--chrome-muted)">
          ~60s · 7 etapas · custo estimado $0.00
        </div>
      </form>
    </ScreenContainer>
  );
}
