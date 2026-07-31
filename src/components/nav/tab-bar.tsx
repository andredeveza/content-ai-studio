"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, LayoutGrid, CalendarDays, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/gerador", label: "Gerador", icon: Sparkles },
  { href: "/projetos", label: "Projetos", icon: LayoutGrid },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/marca", label: "Marca", icon: Palette },
] as const;

// Navegação por abas (README, "Chrome do produto") — só existe a partir
// de agora que as 4 telas ficaram prontas (ver comentário anterior em
// (dashboard)/layout.tsx). Editor e Progresso são telas de fluxo
// (chegam a partir de Projetos/Gerador), não abas fixas.
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-(--chrome-border) bg-(--chrome-surface)/90 backdrop-blur-md">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-center font-mono text-[10px] uppercase tracking-[.08em] transition-colors",
              isActive ? "text-(--chrome-ink)" : "text-(--chrome-muted)",
            )}
          >
            <Icon className="size-4.5" strokeWidth={isActive ? 2.25 : 1.75} />
            <span className={isActive ? "font-semibold" : undefined}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
