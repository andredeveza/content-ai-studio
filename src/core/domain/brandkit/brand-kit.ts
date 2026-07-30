// Espelha o tipo `BrandKit` do README (seção "Brand Kit — modelo de
// dados"), com um desvio: `logo` guarda o caminho no bucket de storage em
// vez de `assetId` — a tabela `media` só existe a partir do bloco 5/7.

export interface FontRef {
  readonly family: string;
  readonly weights: readonly number[];
}

export interface BrandKitPalette {
  readonly ink: string;
  readonly graphite: string;
  readonly slate: string;
  readonly gray: string;
  readonly title: string;
  readonly brand: string;
  readonly primary: string;
  readonly accent: string;
  readonly loud: string;
  readonly bgLight: string;
  readonly panelLight: string;
  readonly titleLight: string;
  readonly textLight: string;
}

export interface BrandKitFonts {
  readonly display: FontRef;
  readonly body: FontRef;
  readonly mono: FontRef;
  readonly editorial?: FontRef;
}

export interface BrandKitLogo {
  readonly path: string | null;
  readonly radius: number;
}

export interface BrandKitChrome {
  readonly top: readonly string[];
  readonly footer: string;
  readonly footerLast: string;
}

export interface BrandKitRules {
  readonly neonMaxArea: "detail";
  readonly alternateModes: boolean;
  readonly blurTextForbidden: true;
}

export interface BrandKit {
  readonly id: string;
  readonly clientId: string;
  readonly palette: BrandKitPalette;
  readonly gradient: string;
  readonly fonts: BrandKitFonts;
  readonly logo: BrandKitLogo;
  readonly chrome: BrandKitChrome;
  readonly rules: BrandKitRules;
  readonly imageStyle: string | null;
  readonly cta: string;
  readonly style: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NewBrandKit {
  readonly palette: BrandKitPalette;
  readonly gradient: string;
  readonly fonts: BrandKitFonts;
  readonly logo?: BrandKitLogo;
  readonly chrome: BrandKitChrome;
  readonly rules: BrandKitRules;
  readonly imageStyle?: string | null;
  readonly cta: string;
  readonly style?: string | null;
}
