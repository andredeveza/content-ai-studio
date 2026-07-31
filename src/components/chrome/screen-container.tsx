import { cn } from "@/lib/utils";

interface ScreenContainerProps {
  // ADENDO-02, "Defeito 1": formulário de uma coluna centraliza em
  // 720px; tela com grid (cards, cobertura) usa 1100px — sem isso, os
  // campos esticam por toda a largura da janela em desktop.
  readonly width?: "form" | "wide";
  readonly className?: string;
  readonly children: React.ReactNode;
}

export function ScreenContainer({ width = "form", className, children }: ScreenContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6",
        width === "form" ? "max-w-[720px]" : "max-w-[1100px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
