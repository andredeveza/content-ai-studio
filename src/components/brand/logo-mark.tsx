import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  readonly size?: "sm" | "md";
  readonly className?: string;
}

// Marca do produto (não do Brand Kit do cliente — essa é sempre a
// escolha do usuário, nunca fixa). Usada no chrome: auth, dashboard.
export function LogoMark({ size = "md", className }: LogoMarkProps) {
  const dimension = size === "sm" ? "size-7" : "size-9";
  const icon = size === "sm" ? "size-3.5" : "size-4.5";

  return (
    <div
      className={cn(
        dimension,
        "flex flex-none items-center justify-center rounded-lg bg-linear-to-br from-[#0A47A8] via-[#1C7ED6] to-[#57A8FF] text-white shadow-sm",
        className,
      )}
    >
      <Sparkles className={icon} strokeWidth={2.25} />
    </div>
  );
}
