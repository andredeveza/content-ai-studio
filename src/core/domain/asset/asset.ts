export type AssetKind = "image" | "pdf" | "font";
export type AssetStatus = "pending" | "analyzed" | "failed";

export interface Asset {
  readonly id: string;
  readonly orgId: string;
  readonly clientId: string;
  readonly path: string;
  readonly mime: string;
  readonly kind: AssetKind;
  readonly status: AssetStatus;
  readonly width: number | null;
  readonly height: number | null;
  readonly dominantColor: string | null;
  readonly luminanceTop: number | null;
  readonly luminanceMid: number | null;
  readonly luminanceBottom: number | null;
  readonly terms: readonly string[];
  readonly excerpts: readonly string[];
  readonly family: string | null;
  readonly error: string | null;
  // Preenchidos só quando o asset veio de um importador em massa
  // (README, "Importar acervo a partir do site do cliente") — sustenta
  // a autorização depois ("registre... é o que sustenta a autorização
  // depois"). Upload manual deixa os dois null.
  readonly sourceUrl: string | null;
  readonly importedBy: string | null;
  readonly analyzedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NewAsset {
  readonly orgId: string;
  readonly clientId: string;
  readonly path: string;
  readonly mime: string;
  readonly kind: AssetKind;
  readonly sourceUrl?: string | null;
  readonly importedBy?: string | null;
}

// Resultado da extração (README, "Extração") — o que
// AnalyzeAssetUseCase grava de volta depois de rodar o serviço certo
// para o `kind` do asset.
export interface AssetAnalysisPatch {
  readonly width?: number;
  readonly height?: number;
  readonly dominantColor?: string;
  readonly luminanceTop?: number;
  readonly luminanceMid?: number;
  readonly luminanceBottom?: number;
  readonly terms?: readonly string[];
  readonly excerpts?: readonly string[];
  readonly family?: string;
}
