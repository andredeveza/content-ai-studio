"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/gerador", label: "Gerador" },
  { href: "/projetos", label: "Projetos" },
  { href: "/agenda", label: "Agenda" },
  { href: "/marca", label: "Marca" },
] as const;

// Navegação por abas (README, "Chrome do produto") — só existe a partir
// de agora que as 4 telas ficaram prontas (ver comentário anterior em
// (dashboard)/layout.tsx). Editor e Progresso são telas de fluxo
// (chegam a partir de Projetos/Gerador), não abas fixas.
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-(--chrome-border) bg-(--chrome-surface)">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex-1 py-3 text-center font-mono text-[10.5px] uppercase tracking-[.1em]",
              isActive ? "text-(--chrome-ink) font-semibold" : "text-(--chrome-muted)",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
