import { cn } from "@/lib/utils";

interface LogoMarkProps {
  readonly size?: "sm" | "md";
  readonly className?: string;
}

// Marca do produto (não do Brand Kit do cliente — essa é sempre a
// escolha do usuário, nunca fixa). Portada literalmente do handoff
// (`design/Content AI Studio - Protótipo AD.dc.html`): dois triângulos
// no viewBox 0 0 220 168, cinza #7A7A7A à esquerda e tinta #0A0A0A à
// direita. Antes era um quadrado com gradiente azul e um ícone de
// sparkles — invenção, não estava em lugar nenhum do design.
export function LogoMark({ size = "md", className }: LogoMarkProps) {
  const width = size === "sm" ? "w-6" : "w-[30px]";

  return (
    <svg viewBox="0 0 220 168" className={cn(width, "flex-none", className)} aria-label="Content AI Studio" role="img">
      <polygon points="12,140 106,22 106,140" fill="#7A7A7A" />
      <polygon points="114,140 114,22 208,140" fill="#0A0A0A" />
    </svg>
  );
}

// Cursor piscando que acompanha a marca no chrome dos protótipos.
// Separado do logo porque nem todo uso quer o cursor (o hero do login,
// por exemplo, é estático).
export function BlinkingCursor({ className }: { readonly className?: string }) {
  return <span aria-hidden className={cn("inline-block animate-blink bg-(--chrome-ink)", className)} />;
}
