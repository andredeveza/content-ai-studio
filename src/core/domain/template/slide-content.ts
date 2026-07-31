export interface SlideContent {
  // slot.key -> texto (slots com `staticText` ignoram isto).
  readonly texts: Record<string, string>;
  // slot.key -> URL da imagem (slots "media").
  readonly media?: Record<string, string>;
  // Opacidade do véu (slot "scrim") calculada pelo RetrieveAssetsService
  // (bloco 7) a partir da luminância real da imagem escolhida — README:
  // "o véu é calculado, não fixo". Ausente = usa o padrão estático do
  // blueprint (ex.: quando a imagem foi gerada por IA, sem luminância
  // medida).
  readonly scrimOpacity?: number;
}
