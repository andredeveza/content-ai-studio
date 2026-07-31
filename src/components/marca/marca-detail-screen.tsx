"use client";

import { useRef, useState, useTransition } from "react";
import type { UpdateClientInput } from "@/core/application/dto/client.dto";
import type { UpsertBrandKitInput } from "@/core/application/dto/brand-kit.dto";
import type { Client } from "@/core/domain/client/client";
import type { BrandKit } from "@/core/domain/brandkit/brand-kit";

type ActionResult = { ok: true } | { ok: false; error: string };

export interface MarcaDetailScreenProps {
  readonly client: Client;
  readonly brandKit: BrandKit | null;
  readonly logoUrl: string | null;
  readonly updateClientAction: (input: UpdateClientInput) => Promise<ActionResult>;
  readonly upsertBrandKitAction: (input: UpsertBrandKitInput) => Promise<ActionResult>;
  readonly uploadLogoAction: (formData: FormData) => Promise<ActionResult>;
  readonly deleteClientAction: () => Promise<ActionResult>;
}

const PALETTE_KEYS = [
  "ink", "graphite", "slate", "gray", "title", "brand", "primary",
  "accent", "loud", "bgLight", "panelLight", "titleLight", "textLight",
] as const;

function toCsv(values: readonly string[]): string {
  return values.join(", ");
}

function fromCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function defaultPalette(): Record<(typeof PALETTE_KEYS)[number], string> {
  return {
    ink: "#06070A", graphite: "#101319", slate: "#1B212B", gray: "#8B94A3",
    title: "#EEF1F6", brand: "#0A47A8", primary: "#1C7ED6", accent: "#57A8FF",
    loud: "#1C4FE0", bgLight: "#FFFFFF", panelLight: "#F4F6FA", titleLight: "#0A0C10", textLight: "#5A6474",
  };
}

export function MarcaDetailScreen({
  client,
  brandKit,
  logoUrl,
  updateClientAction,
  upsertBrandKitAction,
  uploadLogoAction,
  deleteClientAction,
}: MarcaDetailScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isPending, startAction] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(client.name);
  const [handles, setHandles] = useState(toCsv(client.handles));
  const [persona, setPersona] = useState(client.persona ?? "");
  const [tone, setTone] = useState(toCsv(client.tone));
  const [goals, setGoals] = useState(toCsv(client.goals));
  const [specialties, setSpecialties] = useState(toCsv(client.specialties));
  const [site, setSite] = useState(client.site ?? "");

  const [palette, setPalette] = useState(() =>
    brandKit ? { ...defaultPalette(), ...brandKit.palette } : defaultPalette(),
  );
  const [gradient, setGradient] = useState(brandKit?.gradient ?? "linear-gradient(135deg, #0A47A8, #1C7ED6 55%, #57A8FF)");
  const [displayFamily, setDisplayFamily] = useState(brandKit?.fonts.display.family ?? "Satoshi");
  const [displayCssUrl, setDisplayCssUrl] = useState(brandKit?.fonts.display.cssUrl ?? "");
  const [bodyFamily, setBodyFamily] = useState(brandKit?.fonts.body.family ?? "General Sans");
  const [bodyCssUrl, setBodyCssUrl] = useState(brandKit?.fonts.body.cssUrl ?? "");
  const [monoFamily, setMonoFamily] = useState(brandKit?.fonts.mono.family ?? "JetBrains Mono");
  const [monoCssUrl, setMonoCssUrl] = useState(brandKit?.fonts.mono.cssUrl ?? "");
  const [chromeTop, setChromeTop] = useState(toCsv(brandKit?.chrome.top ?? [`@${client.name.toLowerCase().replace(/\s+/g, "")}`]));
  const [footer, setFooter] = useState(brandKit?.chrome.footer ?? "✦ ARRASTE PARA O LADO →");
  const [footerLast, setFooterLast] = useState(brandKit?.chrome.footerLast ?? "SALVE ESTE POST");
  const [imageStyle, setImageStyle] = useState(brandKit?.imageStyle ?? "");
  const [cta, setCta] = useState(brandKit?.cta ?? "Fale com a gente");
  const [style, setStyle] = useState(brandKit?.style ?? "");
  const [alternateModes, setAlternateModes] = useState(brandKit?.rules.alternateModes ?? true);

  function runAction(label: string, fn: () => Promise<ActionResult>): void {
    setError(null);
    setSavedAt(null);
    startAction(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedAt(label);
    });
  }

  function handleSaveClient(event: React.FormEvent): void {
    event.preventDefault();
    runAction("Cliente salvo.", () =>
      updateClientAction({
        name,
        handles: fromCsv(handles),
        persona: persona.trim() || null,
        tone: fromCsv(tone),
        goals: fromCsv(goals),
        specialties: fromCsv(specialties),
        site: site.trim() || null,
      }),
    );
  }

  function handleSaveBrandKit(event: React.FormEvent): void {
    event.preventDefault();
    runAction("Brand kit salvo.", () =>
      upsertBrandKitAction({
        palette,
        gradient,
        fonts: {
          display: { family: displayFamily, weights: [700, 900], cssUrl: displayCssUrl.trim() || undefined },
          body: { family: bodyFamily, weights: [400, 500], cssUrl: bodyCssUrl.trim() || undefined },
          mono: { family: monoFamily, weights: [400, 500], cssUrl: monoCssUrl.trim() || undefined },
        },
        chrome: { top: fromCsv(chromeTop), footer, footerLast },
        rules: { neonMaxArea: "detail", alternateModes, blurTextForbidden: true },
        imageStyle: imageStyle.trim() || null,
        cta,
        style: style.trim() || null,
      }),
    );
  }

  function handleUploadLogo(): void {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    runAction("Logo enviada.", () => uploadLogoAction(formData));
  }

  function handleDelete(): void {
    if (!confirm(`Excluir o cliente "${client.name}"? Esta ação não pode ser desfeita.`)) return;
    runAction("", () => deleteClientAction());
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="mb-1 text-[28px] font-bold tracking-[-.03em] leading-[1.1]">{client.name}</h1>
      <p className="mb-6 text-sm text-(--chrome-muted)">Dados do cliente e brand kit.</p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {savedAt && !error && (
        <div className="mb-4 rounded-md border border-(--chrome-border) bg-(--chrome-surface) px-3 py-2 text-sm text-(--chrome-ok)">
          {savedAt}
        </div>
      )}

      <form onSubmit={handleSaveClient} className="mb-8 grid gap-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">Cliente</h2>
        <Field label="Nome"><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} /></Field>
        <Field label="Handles (separados por vírgula)">
          <input value={handles} onChange={(e) => setHandles(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Persona">
          <textarea value={persona} onChange={(e) => setPersona(e.target.value)} rows={2} className={inputClass} />
        </Field>
        <Field label="Tom de voz (separado por vírgula)">
          <input value={tone} onChange={(e) => setTone(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Objetivos (separado por vírgula)">
          <input value={goals} onChange={(e) => setGoals(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Especialidades (separado por vírgula)">
          <input value={specialties} onChange={(e) => setSpecialties(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Site">
          <input value={site} onChange={(e) => setSite(e.target.value)} className={inputClass} />
        </Field>
        <button type="submit" disabled={isPending} className={submitClass}>
          Salvar cliente
        </button>
      </form>

      <form onSubmit={handleSaveBrandKit} className="grid gap-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">Brand kit</h2>

        <div>
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">Logo</span>
          {logoUrl && <img src={logoUrl} alt="Logo atual" className="mb-2 h-14 w-14 rounded-lg object-cover" />}
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="flex-1 text-sm" />
            <button type="button" onClick={handleUploadLogo} disabled={isPending} className={submitClass}>
              Enviar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PALETTE_KEYS.map((key) => (
            <label key={key} className="grid gap-1">
              <span className="font-mono text-[9.5px] uppercase tracking-[.1em] text-(--chrome-muted)">{key}</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={palette[key]}
                  onChange={(e) => setPalette((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="size-8 rounded border border-(--chrome-border)"
                />
                <input
                  value={palette[key]}
                  onChange={(e) => setPalette((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full rounded-md border border-(--chrome-border) bg-(--chrome-surface) px-2 py-1.5 text-xs"
                />
              </div>
            </label>
          ))}
        </div>

        <Field label="Gradiente (CSS)">
          <input value={gradient} onChange={(e) => setGradient(e.target.value)} className={inputClass} />
        </Field>

        <div className="grid gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">Fontes</span>
          <FontFields label="Display" family={displayFamily} setFamily={setDisplayFamily} cssUrl={displayCssUrl} setCssUrl={setDisplayCssUrl} />
          <FontFields label="Corpo" family={bodyFamily} setFamily={setBodyFamily} cssUrl={bodyCssUrl} setCssUrl={setBodyCssUrl} />
          <FontFields label="Mono" family={monoFamily} setFamily={setMonoFamily} cssUrl={monoCssUrl} setCssUrl={setMonoCssUrl} />
        </div>

        <Field label="Chrome — topo (separado por vírgula)">
          <input value={chromeTop} onChange={(e) => setChromeTop(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Chrome — rodapé">
          <input value={footer} onChange={(e) => setFooter(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Chrome — rodapé (último slide)">
          <input value={footerLast} onChange={(e) => setFooterLast(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Estilo de imagem (prompt de IA)">
          <input value={imageStyle} onChange={(e) => setImageStyle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="CTA padrão">
          <input value={cta} onChange={(e) => setCta(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Estilo (observações livres)">
          <textarea value={style} onChange={(e) => setStyle(e.target.value)} rows={2} className={inputClass} />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={alternateModes} onChange={(e) => setAlternateModes(e.target.checked)} />
          Permitir modos alternativos de layout
        </label>

        <button type="submit" disabled={isPending} className={submitClass}>
          Salvar brand kit
        </button>
      </form>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="mt-8 rounded-md border border-red-200 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[.1em] text-red-700"
      >
        Excluir cliente
      </button>
    </div>
  );
}

const inputClass = "rounded-md border border-(--chrome-border) bg-(--chrome-surface) px-3 py-2.5 text-sm";
const submitClass =
  "rounded-md bg-(--chrome-ink) px-4 py-2.5 font-mono text-[11px] uppercase tracking-[.1em] text-white disabled:opacity-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">{label}</span>
      {children}
    </label>
  );
}

function FontFields({
  label,
  family,
  setFamily,
  cssUrl,
  setCssUrl,
}: {
  label: string;
  family: string;
  setFamily: (v: string) => void;
  cssUrl: string;
  setCssUrl: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="grid gap-1">
        <span className="font-mono text-[9.5px] uppercase tracking-[.1em] text-(--chrome-muted)">{label} — família</span>
        <input value={family} onChange={(e) => setFamily(e.target.value)} className={inputClass} />
      </label>
      <label className="grid gap-1">
        <span className="font-mono text-[9.5px] uppercase tracking-[.1em] text-(--chrome-muted)">{label} — URL do CSS</span>
        <input value={cssUrl} onChange={(e) => setCssUrl(e.target.value)} className={inputClass} />
      </label>
    </div>
  );
}
