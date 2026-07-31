"use client";

interface SlideFrameProps {
  readonly html: string;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly displayWidth: number;
  readonly displayHeight: number;
  readonly className?: string;
}

// Preview em tamanho real escalado por CSS transform (README, Editor:
// "o canvas usa transform: scale() sobre um palco de tamanho real — não
// recalcule tipografia para caber na tela"). O HTML vem de
// TemplateEngineService (bloco 4) — mesmo motor que gera o PNG final no
// serviço de render (bloco 5), então o preview é fiel ao resultado
// publicado, só sem carregar as fontes reais do Brand Kit (isso só
// acontece no Puppeteer, que espera document.fonts.ready).
export function SlideFrame({ html, canvasWidth, canvasHeight, displayWidth, displayHeight, className }: SlideFrameProps) {
  const scale = displayWidth / canvasWidth;

  return (
    <div
      className={className}
      style={{ width: displayWidth, height: displayHeight, overflow: "hidden", position: "relative" }}
    >
      <iframe
        srcDoc={html}
        title="Preview do slide"
        sandbox=""
        style={{
          width: canvasWidth,
          height: canvasHeight,
          border: "none",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
