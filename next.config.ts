import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `sharp` (binário nativo) e `pdf-parse` (usa pdfjs-dist, que carrega
  // recursos por caminho de arquivo) quebram se o webpack tentar
  // empacotá-los no grafo de Server Components — inclusive de forma
  // transitiva, via uma server action vinculada num Server Component
  // (ex.: página "Marca" -> actions.ts -> AnalyzeAssetUseCase). Isso só
  // apareceu rodando de verdade (ver PROGRESSO.md): sem isto, o dev
  // server chega a derrubar o processo inteiro com
  // "ERR_DLOPEN_FAILED"/"Object.defineProperty called on non-object".
  // `serverExternalPackages` resolve os dois via `require()` nativo do
  // Node em vez de deixar o webpack processá-los.
  serverExternalPackages: ["sharp", "pdf-parse"],
};

export default nextConfig;
