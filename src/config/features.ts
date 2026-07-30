export interface FeatureFlags {
  readonly aiProviderKimi: boolean;
  readonly aiProviderGemini: boolean;
  readonly aiProviderHuggingFace: boolean;
  readonly aiProviderReplicate: boolean;
  readonly aiProviderFal: boolean;
  readonly publishingPostiz: boolean;
  readonly publishingInstagram: boolean;
  readonly siteImport: boolean;
}

// Tudo além do essencial do bloco corrente nasce desligado. Ligar é
// mudar um `false` para `true` aqui, nunca reescrever o call site.
export const featureFlags: FeatureFlags = {
  aiProviderKimi: false,
  aiProviderGemini: false,
  aiProviderHuggingFace: false,
  aiProviderReplicate: false,
  aiProviderFal: false,
  publishingPostiz: false,
  publishingInstagram: false,
  siteImport: false,
};
