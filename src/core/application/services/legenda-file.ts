// Conteúdo de `legenda.txt` dentro do zip de exportação (bloco 9,
// README "Publicação": "zip com os PNGs + legenda.txt"). Legenda,
// hashtags e CTA já saem prontos do CopyService (bloco 6) — isto só
// formata pro arquivo de texto que o cliente cola no Instagram.
export function buildLegendaFile(
  caption: string | null,
  hashtags: readonly string[],
  cta: string | null,
): string {
  const parts: string[] = [];

  if (caption) parts.push(caption.trim());
  if (hashtags.length > 0) parts.push(hashtags.map((tag) => `#${tag}`).join(" "));
  if (cta) parts.push(cta.trim());

  return parts.join("\n\n");
}
