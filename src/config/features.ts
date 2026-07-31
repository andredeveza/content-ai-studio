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
  // Ligado: geração real de imagem via Hugging Face Inference API
  // (stable-diffusion-3-medium, README "Ordem de implementação" —
  // pendência crítica corrigida). Sem HUGGINGFACE_API_KEY no ambiente,
  // o provider nem entra no registry (infra/ai/bootstrap.ts).
  aiProviderHuggingFace: true,
  aiProviderReplicate: false,
  aiProviderFal: false,
  publishingPostiz: false,
  publishingInstagram: false,
  siteImport: false,
};
