export interface SlideContent {
  // slot.key -> texto (slots com `staticText` ignoram isto).
  readonly texts: Record<string, string>;
  // slot.key -> URL da imagem (slots "media").
  readonly media?: Record<string, string>;
}
