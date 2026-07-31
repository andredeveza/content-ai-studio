// Porte quase literal de `tokens()`/STOP/keywords/chunks em
// design/Acervo Inteligente.dc.html — um dos dois protótipos que o
// README trata como especificação executável.

const STOP = new Set(
  (
    "a o e de da do das dos em no na nos nas um uma uns umas para por com sem que se como mais mas ou ao aos à às " +
    "pelo pela como sobre entre até já não sim são foi ser está este esta isso aquele qual quais quando onde tem " +
    "tém todos toda todas cada seu sua seus suas nosso nossa você vocês ele ela eles elas the and for with from this that"
  ).split(" "),
);

export function tokens(text: string | null | undefined): string[] {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^a-zà-ú0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP.has(word));
}

// Termos por frequência (README, "Extração" > PDF), top N por contagem.
export function topTermsByFrequency(text: string, limit = 8): string[] {
  const freq: Record<string, number> = {};
  for (const word of tokens(text)) {
    freq[word] = (freq[word] ?? 0) + 1;
  }
  return Object.keys(freq)
    .sort((a, b) => freq[b]! - freq[a]!)
    .slice(0, limit);
}

// Trechos entre 40 e 320 caracteres (README, "Extração" > PDF), quebrado
// por fim de frase.
export function splitExcerpts(text: string, minLength = 40, maxLength = 320): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > minLength && sentence.length < maxLength);
}

// tags do nome do arquivo (topicFit-fallback para imagens): remove
// extensão, troca hífen/underscore por espaço, tokeniza.
export function filenameTags(filename: string): string[] {
  return tokens(filename.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]/g, " "));
}
