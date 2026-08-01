"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, LogOut } from "lucide-react";
import { BlinkingCursor, LogoMark } from "@/components/brand/logo-mark";
import { isNavItemActive, NAV_ITEMS } from "@/components/nav/nav-items";
import { cn } from "@/lib/utils";

export interface SidebarProps {
  readonly signOutAction: () => Promise<void>;
  readonly providers: readonly { readonly label: string; readonly value: string; readonly ok: boolean }[];
}

// Sidebar do protótipo desktop (`design/Content AI Studio - Protótipo
// AD.dc.html`, linha 29: `grid-template-columns:236px 1fr`, linha 32:
// `border-right:1px solid #E4E4E2; background:#FFFFFF; padding:24px 16px;
//  gap:28px; position:sticky; top:0; height:100vh`).
//
// Antes o app mostrava a tab bar mobile em qualquer largura — o desktop
// simplesmente não existia como layout.
export function Sidebar({ signOutAction, providers }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[236px] flex-none flex-col gap-7 border-r border-(--chrome-border) bg-(--chrome-surface) px-4 py-6 lg:flex">
      <div className="flex items-center gap-2.5 px-1.5">
        <LogoMark />
        <span className="text-sm font-bold tracking-[-.01em]">Content AI Studio</span>
        <BlinkingCursor className="h-[15px] w-1.5" />
      </div>

      <nav className="flex flex-col gap-[3px]">
        {NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-[7px] px-2.5 py-2.5 text-[13.5px] capitalize transition-colors",
                isActive
                  ? "bg-(--chrome-terminal) font-medium text-white"
                  : "text-(--chrome-text) hover:bg-(--chrome-surface-2) hover:text-(--chrome-ink)",
              )}
            >
              <Icon className="size-4" strokeWidth={1.4} />
              {item.label}
            </Link>
          );
        })}

        {/* No protótipo mobile, Projetos é o botão de pasta do topo — não
            uma aba. No desktop cabe junto da navegação. */}
        <Link
          href="/projetos"
          aria-current={pathname.startsWith("/projetos") ? "page" : undefined}
          className={cn(
            "mt-1 flex items-center gap-2.5 rounded-[7px] px-2.5 py-2.5 text-[13.5px] capitalize transition-colors",
            pathname.startsWith("/projetos")
              ? "bg-(--chrome-terminal) font-medium text-white"
              : "text-(--chrome-text) hover:bg-(--chrome-surface-2) hover:text-(--chrome-ink)",
          )}
        >
          <FolderOpen className="size-4" strokeWidth={1.4} />
          projetos
        </Link>
      </nav>

      {/* Rodapé "provedores" do protótipo: estado real das capabilities
          de IA, Mono 11px, verde quando ligado. */}
      <div className="mt-auto grid gap-2.5 border-t border-(--chrome-border) pt-4">
        <div className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">provedores</div>
        {providers.map((provider) => (
          <div
            key={provider.label}
            className="flex justify-between gap-2 whitespace-nowrap font-mono text-[11px] text-(--chrome-text)"
          >
            <span>{provider.label}</span>
            <span className={provider.ok ? "text-(--chrome-ok)" : "text-(--chrome-muted)"}>
              {provider.value} {provider.ok ? "✓" : "~"}
            </span>
          </div>
        ))}

        <form action={signOutAction} className="pt-1">
          <button
            type="submit"
            className="flex min-h-11 w-full items-center gap-2.5 rounded-[7px] px-2.5 text-[13.5px] text-(--chrome-text) transition-colors hover:bg-(--chrome-surface-2) hover:text-(--chrome-ink)"
          >
            <LogOut className="size-4" strokeWidth={1.4} />
            sair
          </button>
        </form>
      </div>
    </aside>
  );
}
