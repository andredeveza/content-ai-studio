// Porte de `analyzeFont()` em design/Acervo Inteligente.dc.html. O
// protótipo carrega o arquivo de verdade via FontFace API no navegador;
// no servidor não há como "carregar" a fonte — só registramos a família
// derivada do nome do arquivo (README: "fonte: registra no Brand Kit").
export function deriveFontFamily(filename: string): string {
  const base = filename
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase();
  return `acervo-${base}`;
}
