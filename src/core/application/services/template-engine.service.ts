import type { BrandKit } from "@/core/domain/brandkit/brand-kit";
import type { Blueprint, Canvas, ColorRole, FontRole, Slot } from "@/core/domain/template/blueprint";
import type { SlideContent } from "@/core/domain/template/slide-content";
import { CHROME_TOP_BAND, chromeBottomBand } from "@/templates/geometry";
import { computeClamp } from "@/templates/clamp";

export interface TemplateEngineOptions {
  readonly isLastSlide?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function colorVar(role: ColorRole | undefined, fallback: ColorRole = "title"): string {
  return `var(--bk-${role ?? fallback})`;
}

function fontVar(font: FontRole | undefined): string {
  return `var(--bk-font-${font ?? "body"})`;
}

// A Render em si (Puppeteer, screenshot) é bloco 5 — aqui só produzimos
// HTML + CSS. Template ≠ Brand Kit (regra não negociável nº1): o
// blueprint só conhece papéis de cor/fonte, os valores concretos entram
// como CSS custom properties a partir do BrandKit recebido aqui.
export class TemplateEngineService {
  render(
    blueprint: Blueprint,
    canvas: Canvas,
    content: SlideContent,
    brandKit: BrandKit,
    options: TemplateEngineOptions = {},
  ): string {
    const slots = blueprint.slots(canvas);
    const slotsHtml = slots.map((slot) => this.renderSlot(slot, content)).join("\n");
    const chromeHtml = this.renderChrome(canvas, brandKit, options.isLastSlide ?? false);
    const rootVars = this.buildBrandKitVars(brandKit);

    return [
      "<!doctype html>",
      '<html><head><meta charset="utf-8">',
      `<style>${rootVars} *{box-sizing:border-box;margin:0;padding:0} .stage{position:relative;overflow:hidden;font-family:var(--bk-font-body)}</style>`,
      "</head><body>",
      `<div class="stage" style="width:${canvas.w}px;height:${canvas.h}px;background:${colorVar("ink")}">`,
      slotsHtml,
      chromeHtml,
      "</div>",
      "</body></html>",
    ].join("\n");
  }

  private buildBrandKitVars(brandKit: BrandKit): string {
    const paletteVars = Object.entries(brandKit.palette)
      .map(([role, hex]) => `--bk-${role}:${hex};`)
      .join("");

    const fontVars = (["display", "body", "mono", "editorial"] as const)
      .map((role) => {
        const ref = brandKit.fonts[role];
        return ref ? `--bk-font-${role}:'${ref.family}';` : "";
      })
      .join("");

    return `:root{${paletteVars}${fontVars}}`;
  }

  private renderSlot(slot: Slot, content: SlideContent): string {
    const { box } = slot;
    const position = `position:absolute;left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px;`;

    switch (slot.kind) {
      case "text":
        return this.renderTextSlot(slot, content, position);
      case "media": {
        const url = content.media?.[slot.key];
        const bg = url ? `background-image:url('${url}');background-size:cover;background-position:center;` : "background:var(--bk-panelLight);";
        return `<div style="${position}${bg}"></div>`;
      }
      case "shape": {
        const color = colorVar(slot.color, "panelLight");
        const opacity = slot.opacity ?? 1;
        const radius = slot.radius ?? 0;
        return `<div style="${position}background:${color};opacity:${opacity};border-radius:${radius}px"></div>`;
      }
      case "scrim": {
        const to = colorVar(slot.toColor, "ink");
        const opacity = slot.toOpacity ?? 0.9;
        return `<div style="${position}background:linear-gradient(180deg, rgba(0,0,0,0) 0%, ${to} 100%);opacity:${opacity}"></div>`;
      }
      case "chart-bar": {
        const color = colorVar(slot.color, "accent");
        const radius = slot.radius ?? 0;
        return `<div style="${position}background:${color};border-radius:${radius}px"></div>`;
      }
      default: {
        const exhaustive: never = slot;
        throw new Error(`Slot desconhecido: ${JSON.stringify(exhaustive)}`);
      }
    }
  }

  private renderTextSlot(
    slot: Extract<Slot, { kind: "text" }>,
    content: SlideContent,
    position: string,
  ): string {
    const rawText = slot.staticText ?? content.texts[slot.key] ?? "";
    const text = escapeHtml(rawText);

    const { maxLines, maxHeightPx } = computeClamp(slot.box.h, slot.lineHeight, slot.maxLinesOverride);

    const style = [
      position,
      `font-family:${fontVar(slot.font)};`,
      `font-size:${slot.fontSize}px;`,
      `line-height:${slot.lineHeight}px;`,
      `font-weight:${slot.weight ?? 700};`,
      slot.tracking ? `letter-spacing:${slot.tracking};` : "",
      `color:${colorVar(slot.color)};`,
      `text-align:${slot.align ?? "left"};`,
      slot.background ? `background:${colorVar(slot.background)};` : "",
      slot.radius ? `border-radius:${slot.radius}px;` : "",
      slot.background ? "display:flex;align-items:center;justify-content:center;" : "",
      // Regra de clamp obrigatória: sem isto, texto gerado por IA
      // invade o rodapé do slide (bug real duas vezes nos protótipos).
      `max-height:${maxHeightPx}px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:${maxLines};-webkit-box-orient:vertical;`,
    ].join("");

    return `<div data-slot="${slot.key}" data-max-lines="${maxLines}" data-max-height="${maxHeightPx}" style="${style}">${text}</div>`;
  }

  private renderChrome(canvas: Canvas, brandKit: BrandKit, isLastSlide: boolean): string {
    const topText = escapeHtml(brandKit.chrome.top.join(" · "));
    const footerText = escapeHtml(isLastSlide ? brandKit.chrome.footerLast : brandKit.chrome.footer);
    const bottomBand = chromeBottomBand(canvas.h);

    const topStyle = `position:absolute;left:80px;top:${CHROME_TOP_BAND.y}px;width:920px;height:${CHROME_TOP_BAND.height}px;display:flex;align-items:center;font-family:var(--bk-font-mono);font-size:19px;letter-spacing:0.2em;text-transform:uppercase;color:${colorVar("gray")}`;
    const footerStyle = `position:absolute;left:80px;top:${bottomBand.y + bottomBand.height / 2 - 12}px;width:${canvas.w - 160}px;height:24px;display:flex;align-items:center;justify-content:space-between;font-family:var(--bk-font-mono);font-size:21px;color:${colorVar("title")}`;

    return [
      `<div style="${topStyle}">${topText}</div>`,
      `<div style="${footerStyle}"><span>${footerText}</span></div>`,
    ].join("\n");
  }
}
