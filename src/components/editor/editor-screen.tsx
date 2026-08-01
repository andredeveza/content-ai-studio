"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarPlus, Download, RefreshCw } from "lucide-react";
import { TemplateEngineService } from "@/core/application/services/template-engine.service";
import { ALL_ARCHETYPE_IDS, getBlueprint } from "@/templates/blueprints";
import { blueprintContext, contextForStyle } from "@/templates/context";
import { canvasForRatio, type ProjectRatio } from "@/core/domain/project/project";
import type { ArchetypeId } from "@/core/domain/template/blueprint";
import type { BrandKit } from "@/core/domain/brandkit/brand-kit";
import type { SlideContent } from "@/core/domain/template/slide-content";
import type { LayoutVariant } from "@/core/domain/template/variant";
import { SlideFrame } from "@/components/editor/slide-frame";
import { labelFor } from "@/components/editor/field-labels";
import { cn } from "@/lib/utils";

export interface EditorSlideData {
  readonly id: string;
  readonly index: number;
  readonly archetypeId: ArchetypeId;
  readonly content: SlideContent;
  // Variante persistida do slide: o preview PRECISA usar a mesma que o
  // Puppeteer usou, senão o que o usuário edita não é o que ele exporta.
  readonly variant: LayoutVariant | null;
}

export interface EditorScreenProps {
  readonly ratio: ProjectRatio;
  readonly styleId: string;
  readonly brandKit: BrandKit;
  readonly slides: readonly EditorSlideData[];
  readonly lastIndex: number;
  readonly saveSlideAction: (
    slideId: string,
    patch: { archetypeId?: ArchetypeId; texts?: Record<string, string> },
  ) => Promise<{ ok: true; slide: EditorSlideData } | { ok: false; error: string }>;
  readonly regenerateMediaAction: (
    slideId: string,
  ) => Promise<{ ok: true; slide: EditorSlideData } | { ok: false; error: string }>;
  readonly exportProjectAction: () => Promise<{ ok: true; url: string } | { ok: false; error: string }>;
  readonly scheduleProjectAction: (
    scheduledAt: string,
  ) => Promise<{ ok: true; scheduledAt: string } | { ok: false; error: string }>;
  readonly canSchedule: boolean;
}

const engine = new TemplateEngineService();

const PREVIEW_WIDTH = 280;
const RAIL_THUMB_WIDTH = 52;

function textSlotKeys(archetypeId: ArchetypeId, canvas: { w: number; h: number }): string[] {
  return getBlueprint(archetypeId)
    .slots(blueprintContext(canvas))
    .filter((slot) => slot.kind === "text" && !slot.staticText)
    .map((slot) => slot.key);
}

function hasMediaSlot(archetypeId: ArchetypeId, canvas: { w: number; h: number }): boolean {
  return getBlueprint(archetypeId)
    .slots(blueprintContext(canvas))
    .some((slot) => slot.kind === "media");
}

export function EditorScreen({
  ratio,
  styleId,
  brandKit,
  slides: initialSlides,
  lastIndex,
  saveSlideAction,
  regenerateMediaAction,
  exportProjectAction,
  scheduleProjectAction,
  canSchedule,
}: EditorScreenProps) {
  const canvas = useMemo(() => canvasForRatio(ratio), [ratio]);
  const [slides, setSlides] = useState<readonly EditorSlideData[]>(initialSlides);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draftArchetypeId, setDraftArchetypeId] = useState<ArchetypeId>(initialSlides[0]?.archetypeId ?? "cover-centro");
  const [draftTexts, setDraftTexts] = useState<Record<string, string>>(initialSlides[0]?.content.texts ?? {});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isRegenerating, startRegenerating] = useTransition();
  const [isExporting, startExporting] = useTransition();
  const [isScheduling, startScheduling] = useTransition();
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleValue, setScheduleValue] = useState("");
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);

  const selected = slides[selectedIndex];

  function selectSlide(index: number): void {
    const slide = slides[index];
    if (!slide) return;
    setSelectedIndex(index);
    setDraftArchetypeId(slide.archetypeId);
    setDraftTexts(slide.content.texts);
    setError(null);
  }

  const draftContent: SlideContent = useMemo(
    () => ({
      texts: draftTexts,
      media: selected?.content.media,
      scrimOpacity: selected?.content.scrimOpacity,
    }),
    [draftTexts, selected],
  );

  const previewHtml = useMemo(() => {
    if (!selected) return "";
    return engine.render(getBlueprint(draftArchetypeId), canvas, draftContent, brandKit, {
      isLastSlide: selected.index === lastIndex,
      context: contextForStyle(canvas, styleId, selected.variant),
    });
  }, [selected, draftArchetypeId, draftContent, canvas, brandKit, lastIndex, styleId]);

  const railHeight = Math.round((canvas.h / canvas.w) * RAIL_THUMB_WIDTH);
  const previewHeight = Math.round((canvas.h / canvas.w) * PREVIEW_WIDTH);

  const fields = selected ? textSlotKeys(draftArchetypeId, canvas) : [];
  const showMediaSection = selected ? hasMediaSlot(draftArchetypeId, canvas) : false;

  function handleSave(): void {
    if (!selected) return;
    setError(null);
    startSaving(async () => {
      const archetypeChanged = draftArchetypeId !== selected.archetypeId;
      const result = await saveSlideAction(selected.id, {
        archetypeId: archetypeChanged ? draftArchetypeId : undefined,
        texts: draftTexts,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSlides((prev) => prev.map((slide, i) => (i === selectedIndex ? result.slide : slide)));
    });
  }

  function handleRegenerate(): void {
    if (!selected) return;
    setError(null);
    startRegenerating(async () => {
      const result = await regenerateMediaAction(selected.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSlides((prev) => prev.map((slide, i) => (i === selectedIndex ? result.slide : slide)));
      setDraftTexts(result.slide.content.texts);
    });
  }

  function handleExport(): void {
    setError(null);
    startExporting(async () => {
      const result = await exportProjectAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  function handleSchedule(): void {
    if (!scheduleValue) return;
    setError(null);
    startScheduling(async () => {
      // datetime-local não carrega timezone — converte pro horário local
      // do navegador antes de mandar pro servidor (que exige ISO com Z).
      const iso = new Date(scheduleValue).toISOString();
      const result = await scheduleProjectAction(iso);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setScheduledAt(result.scheduledAt);
      setShowScheduleForm(false);
    });
  }

  if (!selected) {
    return <p className="p-6 text-sm text-(--chrome-muted)">Este projeto ainda não tem slides.</p>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-center border-b border-(--chrome-border) bg-(--chrome-canvas-bg) px-4 py-5">
        <div
          className="overflow-hidden rounded-lg shadow-[0_14px_34px_rgba(0,0,0,.16)]"
          style={{ width: PREVIEW_WIDTH, height: previewHeight }}
        >
          <SlideFrame
            html={previewHtml}
            canvasWidth={canvas.w}
            canvasHeight={canvas.h}
            displayWidth={PREVIEW_WIDTH}
            displayHeight={previewHeight}
          />
        </div>
      </div>

      <div className="noscroll flex gap-2 overflow-x-auto border-b border-(--chrome-border) bg-(--chrome-surface) px-4 py-3">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => selectSlide(index)}
            className="flex flex-none flex-col items-center gap-1"
          >
            <div
              className={cn(
                "overflow-hidden rounded border-[1.5px]",
                index === selectedIndex ? "border-(--chrome-ink)" : "border-(--chrome-border)",
              )}
              style={{ width: RAIL_THUMB_WIDTH, height: railHeight }}
            >
              <SlideFrame
                html={engine.render(getBlueprint(slide.archetypeId), canvas, slide.content, brandKit, {
                  isLastSlide: slide.index === lastIndex,
                  context: contextForStyle(canvas, styleId, slide.variant),
                })}
                canvasWidth={canvas.w}
                canvasHeight={canvas.h}
                displayWidth={RAIL_THUMB_WIDTH}
                displayHeight={railHeight}
              />
            </div>
            <span className="font-mono text-[9px] text-(--chrome-muted)">
              {String(index + 1).padStart(2, "0")}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 px-4 py-5">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <section className="grid gap-3">
          <h2 className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">
            slide {String(selected.index + 1).padStart(2, "0")}
          </h2>
          {fields.map((key) => (
            <label key={key} className="grid gap-1.5">
              <span className="text-[11.5px] text-(--chrome-muted)">{labelFor(draftArchetypeId, key)}</span>
              <textarea
                value={draftTexts[key] ?? ""}
                onChange={(event) => setDraftTexts((prev) => ({ ...prev, [key]: event.target.value }))}
                rows={key === "heading" ? 2 : 3}
                className="resize-y rounded-md border border-(--chrome-border) bg-(--chrome-surface) p-3 text-[15px] text-(--chrome-ink) outline-none focus:border-(--chrome-ink)"
              />
            </label>
          ))}
        </section>

        <section className="grid gap-3">
          <h2 className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">variante</h2>
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_ARCHETYPE_IDS.map((archetypeId) => {
              const isSelected = archetypeId === draftArchetypeId;
              return (
                <button
                  key={archetypeId}
                  type="button"
                  onClick={() => setDraftArchetypeId(archetypeId)}
                  className={cn(
                    "flex min-h-12 items-center justify-center rounded-md border px-3.5 py-3.5 text-center text-sm",
                    isSelected
                      ? "border-(--chrome-ink) bg-(--chrome-ink) text-white"
                      : "border-(--chrome-border) bg-(--chrome-surface) text-(--chrome-ink)",
                  )}
                >
                  {getBlueprint(archetypeId).name}
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">brand kit</h2>
          <div className="flex min-h-12 items-center gap-2.5 rounded-md border border-(--chrome-border) bg-(--chrome-surface) p-3.5">
            <span
              className="size-4 flex-none rounded border border-(--chrome-border)"
              style={{ background: brandKit.palette.ink }}
            />
            <span className="size-4 flex-none rounded" style={{ background: brandKit.palette.primary }} />
            <span className="size-4 flex-none rounded" style={{ background: brandKit.palette.accent }} />
            <span className="ml-0.5 text-sm text-(--chrome-ink)">Brand kit do cliente</span>
          </div>
        </section>

        {showMediaSection && (
          <section className="grid gap-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">mídia</h2>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-(--chrome-border) bg-(--chrome-surface) px-3.5 py-3.5 text-sm text-(--chrome-ink) disabled:opacity-60"
            >
              <RefreshCw className="size-[15px]" />
              {isRegenerating ? "Gerando…" : "Regerar imagem"}
            </button>
          </section>
        )}

        {canSchedule && (
          <section className="grid gap-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">agenda</h2>
            {scheduledAt && !showScheduleForm && (
              <p className="text-[13px] text-(--chrome-text)">
                Agendado para {new Date(scheduledAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}.
              </p>
            )}
            {showScheduleForm ? (
              <div className="grid gap-2">
                <input
                  type="datetime-local"
                  value={scheduleValue}
                  onChange={(event) => setScheduleValue(event.target.value)}
                  className="rounded-md border border-(--chrome-border) bg-(--chrome-surface) p-3 text-[15px] text-(--chrome-ink) outline-none focus:border-(--chrome-ink)"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSchedule}
                    disabled={isScheduling || !scheduleValue}
                    className="min-h-12 flex-1 rounded-md bg-(--chrome-ink) px-3.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isScheduling ? "Agendando…" : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className="min-h-12 flex-1 rounded-md border border-(--chrome-border) bg-(--chrome-surface) px-3.5 text-sm text-(--chrome-ink)"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowScheduleForm(true)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-(--chrome-border) bg-(--chrome-surface) px-3.5 py-3.5 text-sm text-(--chrome-ink)"
              >
                <CalendarPlus className="size-[15px]" />
                {scheduledAt ? "Reagendar publicação" : "Agendar publicação"}
              </button>
            )}
          </section>
        )}

        <div className="grid gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="min-h-13 rounded-lg bg-(--chrome-ink) px-4 py-4 text-[15.5px] font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? "Salvando…" : "Salvar edição"}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex min-h-13 items-center justify-center gap-2 rounded-lg border border-(--chrome-border) bg-(--chrome-surface) px-4 py-4 text-[14.5px] text-(--chrome-ink) disabled:opacity-60"
          >
            <Download className="size-[15px]" />
            {isExporting ? "Gerando zip…" : "Exportar PNG"}
          </button>
        </div>
      </div>
    </div>
  );
}
