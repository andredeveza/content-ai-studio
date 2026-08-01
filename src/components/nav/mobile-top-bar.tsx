"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, LogOut } from "lucide-react";
import { BlinkingCursor, LogoMark } from "@/components/brand/logo-mark";
import { NAV_ITEMS, isNavItemActive } from "@/components/nav/nav-items";

// Top bar do protótipo mobile (handoff, linha 33):
// `position:sticky; top:0; background:#FFFFFFEE; backdrop-filter:blur(8px);
//  border-bottom:1px solid #E4E4E2; padding:14px 18px`.
// Logo + cursor piscando + rótulo da tela em Mono 10px .16em uppercase,
// e à direita o botão de pasta 44×44 que leva a Projetos.
export function MobileTopBar({ signOutAction }: { readonly signOutAction: () => Promise<void> }) {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((item) => isNavItemActive(pathname, item.href));
  const screenLabel = pathname.startsWith("/projetos") ? "projetos" : (current?.label ?? "content ai studio");

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-(--chrome-border) bg-[#FFFFFFEE] px-4.5 py-3.5 backdrop-blur-[8px] lg:hidden">
      <div className="flex min-w-0 items-center gap-2">
        <LogoMark size="sm" />
        <BlinkingCursor className="h-3.5 w-1.25" />
        <div className="truncate font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">
          {screenLabel}
        </div>
      </div>

      <div className="flex flex-none items-center gap-2">
        <Link
          href="/projetos"
          aria-label="Projetos"
          className="flex size-11 items-center justify-center rounded-[9px] border border-(--chrome-border) bg-(--chrome-surface-2) text-(--chrome-ink)"
        >
          <FolderOpen className="size-4" strokeWidth={1.4} />
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Sair"
            className="flex size-11 items-center justify-center rounded-[9px] border border-(--chrome-border) bg-(--chrome-surface-2) text-(--chrome-ink)"
          >
            <LogOut className="size-4" strokeWidth={1.4} />
          </button>
        </form>
      </div>
    </header>
  );
}
