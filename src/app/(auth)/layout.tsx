import Image from "next/image";
import { LogoMark } from "@/components/brand/logo-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      <div className="relative hidden flex-1 overflow-hidden bg-black lg:flex lg:flex-col lg:justify-end">
        {/* Gerada por IA (Hugging Face) — ver COMO-TESTAR-E-PENDENCIAS.md. */}
        <Image
          src="/brand/auth-hero.jpg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-black/10" />
        <div className="relative z-10 flex flex-col gap-6 p-12">
          <LogoMark />
          <h1 className="max-w-md text-4xl font-bold leading-[1.12] tracking-[-0.02em] text-white">
            Carrosséis de Instagram, escritos e desenhados por IA — na cara da marca do seu cliente.
          </h1>
          <p className="max-w-sm text-sm text-white/60">
            Tema entra, carrossel pronto sai: copy, imagens, layout e legenda, sem sair do brand kit.
          </p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center bg-(--chrome-bg) p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <LogoMark size="sm" />
            <span className="font-mono text-[11px] uppercase tracking-[.18em] text-(--chrome-muted)">
              Content AI Studio
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
