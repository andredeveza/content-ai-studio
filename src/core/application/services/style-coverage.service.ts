import { COMPOSITION_STYLES, type StyleRequirementNeed } from "@/core/domain/template/composition-style";
import type { Asset } from "@/core/domain/asset/asset";
import type { AssetRepository } from "@/core/domain/ports/asset-repository";
import type { BrandKit } from "@/core/domain/brandkit/brand-kit";

// Faixa "escura o bastante para o título ficar legível" — mesmo
// raciocínio de `illegible` em asset-scoring.service.ts (contrastFit
// alto quando a luminância é baixa), só que aqui decide disponibilidade
// de estilo, não pontuação de slide.
const DARK_BAND_THRESHOLD = 0.4;
// "Vertical o bastante" pra 4:5/9:16 — mais alta que larga já conta;
// não temos classificação por visão computacional (README trataria
// isso como `kind: 'logo'|'equipe'|...` via AIGateway de visão, ainda
// não ligado), então aspecto é o proxy honesto disponível hoje.
const PORTRAIT_ASPECT_MAX = 0.95;

export interface StyleAvailability {
  // Slug, não o ordinal `id` ("01") — é o que `projects.style_id`
  // guarda e o que o Gerador manda de volta na hora de gerar.
  readonly id: string;
  readonly name: string;
  readonly available: boolean;
  readonly reason: string | null;
}

export interface StyleCoverageResult {
  readonly available: number;
  readonly total: number;
  readonly styles: readonly StyleAvailability[];
}

function luminanceAtBand(asset: Asset, band: "top" | "bottom"): number | null {
  return band === "top" ? asset.luminanceTop : asset.luminanceBottom;
}

function matchesImageNeed(asset: Asset, need: Extract<StyleRequirementNeed, { kind: "image" }>): boolean {
  if (asset.width == null || asset.height == null || asset.height === 0) return false;
  if (need.ratio && need.ratio !== "1:1") {
    const aspect = asset.width / asset.height;
    if (aspect > PORTRAIT_ASPECT_MAX) return false;
  }
  if (need.darkBand) {
    const luminance = luminanceAtBand(asset, need.darkBand);
    if (luminance == null || luminance >= DARK_BAND_THRESHOLD) return false;
  }
  return true;
}

function describeImageNeed(need: Extract<StyleRequirementNeed, { kind: "image" }>): string {
  const parts: string[] = ["precisa de uma foto"];
  if (need.ratio && need.ratio !== "1:1") parts.push("vertical");
  if (need.darkBand === "bottom") parts.push("com faixa inferior escura");
  if (need.darkBand === "top") parts.push("com faixa superior escura");
  return parts.join(" ") + " no acervo.";
}

// ADENDO-01, "Cobertura de estilos": "estilo bloqueado nunca desaparece
// da lista... com o motivo à mostra". Roda ao vivo contra o acervo
// (nunca um contador salvo) — reavaliar depois de cada ingestão é só
// chamar de novo.
export class StyleCoverageService {
  constructor(private readonly assets: AssetRepository) {}

  async evaluate(orgId: string, clientId: string, brandKit: BrandKit | null): Promise<StyleCoverageResult> {
    const allAssets = await this.assets.listByClient(orgId, clientId);
    const images = allAssets.filter((asset) => asset.kind === "image" && asset.status === "analyzed");
    const pdfsWithExcerpts = allAssets.filter(
      (asset) => asset.kind === "pdf" && asset.status === "analyzed" && asset.excerpts.length > 0,
    );

    const styles = COMPOSITION_STYLES.map((style): StyleAvailability => {
      for (const need of style.requires) {
        const failure = this.checkNeed(need, images, pdfsWithExcerpts, brandKit);
        if (failure) return { id: style.slug, name: style.name, available: false, reason: failure };
      }
      return { id: style.slug, name: style.name, available: true, reason: null };
    });

    return { available: styles.filter((s) => s.available).length, total: styles.length, styles };
  }

  // Retorna o motivo quando a necessidade NÃO é atendida, ou `null`
  // quando está ok — inverso de um booleano de propósito, pra
  // `evaluate` só precisar de um `if (failure)`.
  private checkNeed(
    need: StyleRequirementNeed,
    images: readonly Asset[],
    pdfsWithExcerpts: readonly Asset[],
    brandKit: BrandKit | null,
  ): string | null {
    switch (need.kind) {
      case "logo":
        return brandKit?.logo.path ? null : "precisa de um logo cadastrado no brand kit.";
      case "quote-source":
        return pdfsWithExcerpts.length > 0 ? null : "precisa de um PDF com trechos extraídos no acervo.";
      case "numeric-series":
        return "precisa de uma planilha de dados (ainda não suportado).";
      case "image": {
        const min = need.min ?? 1;
        const matching = images.filter((asset) => matchesImageNeed(asset, need));
        return matching.length >= min ? null : describeImageNeed(need);
      }
      default: {
        const exhaustive: never = need;
        throw new Error(`Necessidade de estilo desconhecida: ${JSON.stringify(exhaustive)}`);
      }
    }
  }
}
