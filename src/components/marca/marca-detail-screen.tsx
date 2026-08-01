"use client";

import { useRef, useState, useTransition } from "react";
import {
  Image as ImageIcon,
  FileText,
  Type as FontIcon,
  UploadCloud,
  Globe,
  AtSign,
  FolderArchive,
  Check,
  Lock,
  Loader2,
  Palette as PaletteIcon,
  Quote,
} from "lucide-react";
import type { UpdateClientInput } from "@/core/application/dto/client.dto";
import type { UpsertBrandKitInput } from "@/core/application/dto/brand-kit.dto";
import type { Client } from "@/core/domain/client/client";
import type { BrandKit } from "@/core/domain/brandkit/brand-kit";
import type { Asset } from "@/core/domain/asset/asset";
import type { StyleCoverageResult } from "@/core/application/services/style-coverage.service";
import { ScreenContainer } from "@/components/chrome/screen-container";
import { cn } from "@/lib/utils";

type ActionResult = { ok: true } | { ok: false; error: string };

// Definidos aqui (não em actions.ts) de propósito, mesma convenção de
// EditorSlideData em components/editor/editor-screen.tsx: um Client
// Component nunca importa (nem só tipo) de um módulo que puxe, direto
// ou transitivo, algo com dependência nativa incompatível com o
// bundler de Server Components (aqui: import-site.ts -> analyze-asset.ts
// -> pdf-extraction.service.ts -> pacote `pdf-parse`) — mesmo
// `import type` sendo apagado no JS final, o dev server processa o
// arquivo de origem antes da erasure e quebra a build com
// "Object.defineProperty called on non-object" (só descoberto rodando
// de verdade — ver PROGRESSO.md). Por isso o formato de
// ImportSiteActionResult é redeclarado aqui, sem importar
// ImportSiteResult; actions.ts importa os tipos DAQUI, nunca o
// contrário.
export type AssetWithUrl = Asset & { readonly url: string | null };
export type IngestAssetActionResult = { ok: true; asset: AssetWithUrl } | { ok: false; error: string };
export type ImportSiteActionResult =
  | {
      ok: true;
      result: {
        readonly sourceUrl: string;
        readonly suggestedText: string | null;
        readonly suggestedColor: string | null;
        readonly ingestedLogo: AssetWithUrl | null;
      };
    }
  | { ok: false; error: string };

export interface MarcaDetailScreenProps {
  readonly client: Client;
  readonly brandKit: BrandKit | null;
  readonly logoUrl: string | null;
  readonly assets: readonly AssetWithUrl[];
  readonly coverage: StyleCoverageResult;
  readonly updateClientAction: (input: UpdateClientInput) => Promise<ActionResult>;
  readonly upsertBrandKitAction: (input: UpsertBrandKitInput) => Promise<ActionResult>;
  readonly uploadLogoAction: (formData: FormData) => Promise<ActionResult>;
  readonly deleteClientAction: () => Promise<ActionResult>;
  readonly ingestAssetAction: (formData: FormData) => Promise<IngestAssetActionResult>;
  readonly importSiteAction: (url: string) => Promise<ImportSiteActionResult>;
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

const KIND_ICON = { image: ImageIcon, pdf: FileText, font: FontIcon } as const;
const KIND_LABEL = { image: "Imagem", pdf: "PDF", font: "Fonte" } as const;

export function MarcaDetailScreen({
  client,
  brandKit,
  logoUrl,
  assets: initialAssets,
  coverage,
  updateClientAction,
  upsertBrandKitAction,
  uploadLogoAction,
  deleteClientAction,
  ingestAssetAction,
  importSiteAction,
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

  // Acervo (ADENDO-01/ADENDO-02): estado local só de exibição — a
  // fonte de verdade é o banco; isto só evita recarregar a página a
  // cada arquivo ingerido.
  const [assets, setAssets] = useState(initialAssets);
  const [uploadingCount, setUploadingCount] = useState(0);
  // ADENDO-01 / protótipo: o dropzone tem TRÊS estados (ocioso ·
  // analisando, com barra e passo · concluído). Faltava o terceiro — o
  // usuário não tinha confirmação de que a ingestão deu certo.
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadDone, setUploadDone] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [siteUrl, setSiteUrl] = useState(site || "");
  const [siteConfirmed, setSiteConfirmed] = useState(false);
  const [siteImportPending, startSiteImport] = useTransition();
  const [siteImportResult, setSiteImportResult] = useState<Extract<ImportSiteActionResult, { ok: true }>["result"] | null>(
    null,
  );
  const [siteImportError, setSiteImportError] = useState<string | null>(null);
  const [appliedColor, setAppliedColor] = useState(false);
  const [appliedText, setAppliedText] = useState(false);

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

  function ingestFiles(files: FileList | File[]): void {
    const list = Array.from(files);
    if (list.length === 0) return;
    setError(null);
    setUploadingCount((n) => n + list.length);
    setUploadTotal((n) => (n === uploadDone ? list.length : n + list.length));
    if (uploadingCount === 0) setUploadDone(0);
    for (const file of list) {
      const formData = new FormData();
      formData.set("file", file);
      startAction(async () => {
        const result = await ingestAssetAction(formData);
        setUploadingCount((n) => Math.max(0, n - 1));
        setUploadDone((n) => n + 1);
        if (!result.ok) {
          setError(`"${file.name}": ${result.error}`);
          return;
        }
        setAssets((prev) => [result.asset, ...prev]);
      });
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDraggingOver(false);
    if (event.dataTransfer.files.length > 0) ingestFiles(event.dataTransfer.files);
  }

  function handleImportSite(event: React.FormEvent): void {
    event.preventDefault();
    setSiteImportError(null);
    setSiteImportResult(null);
    setAppliedColor(false);
    setAppliedText(false);
    if (!siteUrl.trim()) {
      setSiteImportError("Cole a URL do site.");
      return;
    }
    if (!siteConfirmed) {
      setSiteImportError("Confirme que este é o site do cliente antes de importar.");
      return;
    }
    startSiteImport(async () => {
      const result = await importSiteAction(siteUrl.trim());
      if (!result.ok) {
        setSiteImportError(result.error);
        return;
      }
      setSiteImportResult(result.result);
      if (result.result.ingestedLogo) setAssets((prev) => [result.result.ingestedLogo!, ...prev]);
    });
  }

  function applySuggestedColor(): void {
    if (!siteImportResult?.suggestedColor) return;
    setPalette((prev) => ({ ...prev, primary: siteImportResult.suggestedColor! }));
    setAppliedColor(true);
  }

  function applySuggestedText(): void {
    if (!siteImportResult?.suggestedText) return;
    setStyle((prev) => (prev ? `${prev}\n${siteImportResult.suggestedText}` : siteImportResult.suggestedText!));
    setAppliedText(true);
  }

  return (
    <ScreenContainer width="wide" className="pt-6 pb-10">
      <h1 className="mb-1 text-[28px] font-bold tracking-[-.03em] leading-[1.1]">{client.name}</h1>
      <p className="mb-6 text-sm text-(--chrome-muted)">Acervo, dados do cliente e brand kit.</p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {savedAt && !error && (
        <div className="mb-4 rounded-md border border-(--chrome-border) bg-(--chrome-surface) px-3 py-2 text-sm text-(--chrome-ok)">
          {savedAt}
        </div>
      )}

      {/* ADENDO-02, Defeito 2, correção 1: bloco de ingestão completo
          ANTES dos campos manuais — dropzone + importadores em massa. */}
      <section className="mb-8 grid gap-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">Acervo</h2>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("acervo-file-input")?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            isDraggingOver ? "border-(--chrome-ink) bg-(--chrome-surface-2)" : "border-(--chrome-border) bg-(--chrome-surface)",
          )}
        >
          <UploadCloud className="size-6 text-(--chrome-muted)" strokeWidth={1.5} />
          <p className="text-sm font-medium">Arraste arquivos aqui ou clique para escolher</p>
          <p className="text-xs text-(--chrome-faint)">Imagens (jpg, png, webp), PDF e fontes (ttf, otf, woff2)</p>
          <input
            id="acervo-file-input"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,application/pdf,.ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={(e) => e.target.files && ingestFiles(e.target.files)}
          />
        </div>

        {uploadingCount > 0 && (
          <div className="grid gap-2 rounded-[10px] border border-(--chrome-border) bg-(--chrome-surface) px-3.5 py-3">
            <div className="flex items-center gap-2 text-sm text-(--chrome-ink)">
              <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
              Analisando {uploadingCount} arquivo{uploadingCount > 1 ? "s" : ""}…
            </div>
            {/* Barra + passo: o protótipo mostra o progresso, não só um
                spinner sem fim. */}
            <div className="h-1 overflow-hidden rounded-sm bg-(--chrome-border)">
              <div
                className="h-1 rounded-sm bg-(--chrome-terminal)"
                style={{
                  width: `${uploadTotal > 0 ? Math.round((uploadDone / uploadTotal) * 100) : 0}%`,
                  transition: "width 400ms cubic-bezier(.2,.6,.2,1)",
                }}
              />
            </div>
            <div className="font-mono text-[10px] text-(--chrome-muted)">
              {uploadDone}/{uploadTotal} · extraindo cor, dimensão e termos
            </div>
          </div>
        )}

        {uploadingCount === 0 && uploadDone > 0 && (
          <div className="flex items-center gap-2 rounded-[10px] border border-(--chrome-ok)/30 bg-(--chrome-ok)/10 px-3.5 py-3 text-sm text-(--chrome-ok)">
            <Check className="size-4" strokeWidth={2.25} />
            {uploadDone} arquivo{uploadDone > 1 ? "s" : ""} no acervo.
          </div>
        )}

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <ImporterButton icon={Globe} label="Site" description="cores, texto e logo" available />
          <ImporterButton icon={AtSign} label="Instagram" description="requer Graph API do cliente" available={false} />
          <ImporterButton icon={FolderArchive} label="ZIP / pasta" description="em breve" available={false} />
        </div>

        <form onSubmit={handleImportSite} className="grid gap-2 rounded-[9px] border border-(--chrome-border) bg-(--chrome-surface) p-3.5">
          <div className="flex gap-2">
            <input
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://sitedocliente.com.br"
              className={cn(inputClass, "flex-1")}
            />
            <button type="submit" disabled={siteImportPending} className={submitClass}>
              {siteImportPending ? <Loader2 className="size-4 animate-spin" /> : "Importar site"}
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs text-(--chrome-muted)">
            <input type="checkbox" checked={siteConfirmed} onChange={(e) => setSiteConfirmed(e.target.checked)} />
            Confirmo que este é o site do meu cliente
          </label>
          {siteImportError && <p className="text-sm text-red-700">{siteImportError}</p>}
        </form>

        {siteImportResult && (
          <div className="grid gap-2 rounded-[9px] border border-(--chrome-ink) bg-(--chrome-surface) p-3.5">
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">
              Sugestão do site — revise antes de aplicar
            </p>
            {siteImportResult.suggestedColor && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="size-5 rounded-full border border-(--chrome-border)" style={{ background: siteImportResult.suggestedColor }} />
                  Cor sugerida: {siteImportResult.suggestedColor}
                </div>
                <button type="button" onClick={applySuggestedColor} disabled={appliedColor} className="text-xs font-medium underline underline-offset-4 disabled:no-underline disabled:text-(--chrome-ok)">
                  {appliedColor ? "aplicada em Cor primária" : "usar esta cor"}
                </button>
              </div>
            )}
            {siteImportResult.suggestedText && (
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-(--chrome-text)">&quot;{siteImportResult.suggestedText}&quot;</p>
                <button type="button" onClick={applySuggestedText} disabled={appliedText} className="flex-none text-xs font-medium underline underline-offset-4 disabled:no-underline disabled:text-(--chrome-ok)">
                  {appliedText ? "aplicado em Estilo" : "usar este texto"}
                </button>
              </div>
            )}
            {siteImportResult.ingestedLogo && <p className="text-xs text-(--chrome-ok)">Logo do site adicionado ao acervo.</p>}
            {!siteImportResult.suggestedColor && !siteImportResult.suggestedText && (
              <p className="text-sm text-(--chrome-muted)">Nada extraível encontrado nesse site.</p>
            )}
          </div>
        )}

        <CoverageBar coverage={coverage} />

        {assets.length > 0 && <AssetInventory assets={assets} />}
      </section>

      <form onSubmit={handleSaveClient} className="mb-8 grid gap-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">Cliente (conferência)</h2>
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
        <button type="submit" disabled={isPending} className={cn(submitClass, "justify-self-start")}>
          Salvar cliente
        </button>
      </form>

      <form onSubmit={handleSaveBrandKit} className="grid gap-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">Brand kit (conferência)</h2>

        <div>
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">Logo</span>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo atual" className="mb-2 h-14 w-14 rounded-lg object-cover" />
          ) : (
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-(--chrome-border) text-(--chrome-faint)">
              <ImageIcon className="size-5" strokeWidth={1.5} />
            </div>
          )}
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="flex-1 text-sm" />
            <button type="button" onClick={handleUploadLogo} disabled={isPending} className={submitClass}>
              Enviar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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

        <div className="grid gap-3 sm:grid-cols-3">
          <FontFields label="Display" family={displayFamily} setFamily={setDisplayFamily} cssUrl={displayCssUrl} setCssUrl={setDisplayCssUrl} />
          <FontFields label="Corpo" family={bodyFamily} setFamily={setBodyFamily} cssUrl={bodyCssUrl} setCssUrl={setBodyCssUrl} />
          <FontFields label="Mono" family={monoFamily} setFamily={setMonoFamily} cssUrl={monoCssUrl} setCssUrl={setMonoCssUrl} />
        </div>

        <Field label="Chrome — topo (separado por vírgula)">
          <input value={chromeTop} onChange={(e) => setChromeTop(e.target.value)} className={inputClass} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Chrome — rodapé">
            <input value={footer} onChange={(e) => setFooter(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Chrome — rodapé (último slide)">
            <input value={footerLast} onChange={(e) => setFooterLast(e.target.value)} className={inputClass} />
          </Field>
        </div>
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

        <button type="submit" disabled={isPending} className={cn(submitClass, "justify-self-start")}>
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
    </ScreenContainer>
  );
}

function ImporterButton({
  icon: Icon,
  label,
  description,
  available,
}: {
  icon: typeof Globe;
  label: string;
  description: string;
  available: boolean;
}) {
  return (
    <div
      title={available ? undefined : description}
      className={cn(
        "flex items-center gap-2.5 rounded-[9px] border px-3 py-2.5",
        available ? "border-(--chrome-border) bg-(--chrome-surface)" : "border-dashed border-(--chrome-border) bg-(--chrome-surface-2) opacity-60",
      )}
    >
      <Icon className="size-4 flex-none" strokeWidth={1.75} />
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="truncate text-[10.5px] text-(--chrome-muted)">{description}</div>
      </div>
    </div>
  );
}

function CoverageBar({ coverage }: { coverage: StyleCoverageResult }) {
  return (
    <div className="grid gap-2 rounded-[9px] border border-(--chrome-border) bg-(--chrome-surface) p-3.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">Cobertura de estilos</span>
        <span className="font-mono text-[11px] font-semibold">
          {coverage.available} / {coverage.total}
        </span>
      </div>
      <div className="flex gap-1">
        {coverage.styles.map((s) => (
          <span key={s.id} className={cn("h-1.5 flex-1 rounded-full", s.available ? "bg-(--chrome-ok)" : "bg-(--chrome-border)")} />
        ))}
      </div>
      <div className="grid gap-1.5">
        {coverage.styles.map((s) => (
          <div key={s.id} className="flex items-start gap-2 text-[12.5px]">
            {s.available ? (
              <Check className="mt-0.5 size-3.5 flex-none text-(--chrome-ok)" strokeWidth={2.5} />
            ) : (
              <Lock className="mt-0.5 size-3.5 flex-none text-(--chrome-faint)" strokeWidth={1.75} />
            )}
            <span className={s.available ? "text-(--chrome-text)" : "text-(--chrome-muted)"}>
              {s.name}
              {!s.available && s.reason && <span className="text-(--chrome-faint)"> — {s.reason}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetInventory({ assets }: { assets: readonly AssetWithUrl[] }) {
  const groups: Record<string, AssetWithUrl[]> = {};
  for (const asset of assets) {
    (groups[asset.kind] ??= []).push(asset);
  }

  return (
    <div className="grid gap-3">
      {Object.entries(groups).map(([kind, kindAssets]) => {
        const Icon = KIND_ICON[kind as keyof typeof KIND_ICON];
        return (
          <div key={kind} className="grid gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">
              {KIND_LABEL[kind as keyof typeof KIND_LABEL]} ({kindAssets.length})
            </span>
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {kindAssets.map((asset) => (
                <div key={asset.id} className="flex items-center gap-2.5 rounded-[9px] border border-(--chrome-border) bg-(--chrome-surface) p-2.5">
                  {asset.kind === "image" && asset.status === "analyzed" && asset.url ? (
                    <img src={asset.url} alt="" className="size-10 flex-none rounded-md object-cover" />
                  ) : (
                    <div className="flex size-10 flex-none items-center justify-center rounded-md bg-(--chrome-surface-2) text-(--chrome-muted)">
                      <Icon className="size-4" strokeWidth={1.75} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 text-[11.5px] text-(--chrome-muted)">
                    {asset.status === "pending" && <span className="flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> analisando…</span>}
                    {asset.status === "failed" && <span className="text-red-700">falhou: {asset.error}</span>}
                    {asset.status === "analyzed" && asset.kind === "image" && (
                      <span className="flex items-center gap-1.5">
                        {asset.width}×{asset.height}
                        {asset.dominantColor && <span className="size-2.5 rounded-full border border-(--chrome-border)" style={{ background: asset.dominantColor }} />}
                      </span>
                    )}
                    {asset.status === "analyzed" && asset.kind === "pdf" && (
                      <span className="flex items-center gap-1">
                        <Quote className="size-3 flex-none" /> {asset.excerpts.length} trecho{asset.excerpts.length === 1 ? "" : "s"}
                      </span>
                    )}
                    {asset.status === "analyzed" && asset.kind === "font" && (
                      <span className="flex items-center gap-1">
                        <PaletteIcon className="size-3 flex-none" /> {asset.family ?? "família não identificada"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
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
    <div className="grid gap-2">
      {/* README, tela "Marca": "tipografia (cada linha renderiza na
          própria fonte)". A amostra usa a família digitada e a URL do
          CSS informada logo abaixo — se a fonte não carregar, o próprio
          usuário vê na hora, em vez de descobrir só no PNG final. */}
      <div
        className="rounded-[9px] border border-(--chrome-border) bg-(--chrome-surface-2) px-3 py-2.5 text-[19px] leading-tight"
        style={{ fontFamily: `'${family}', system-ui, sans-serif` }}
      >
        {family || "—"}
      </div>
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
