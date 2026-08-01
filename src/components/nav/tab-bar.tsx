"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, NAV_ITEMS } from "@/components/nav/nav-items";
import { cn } from "@/lib/utils";

// Tab bar do protótipo mobile, valores literais do handoff:
// `position:fixed; bottom:0; background:#FFFFFFF2; backdrop-filter:blur(10px);
//  border-top:1px solid #E4E4E2; grid-template-columns:repeat(5,1fr);
//  padding:8px 4px 14px 4px`, ícone 20px, rótulo Mono 9.5px MINÚSCULO,
// ativo `#0A0A0A`, inativo `#B8B8B4` (--chrome-faint, não --chrome-muted).
//
// Só no mobile: no desktop o protótipo usa a sidebar de 236px.
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-30 grid grid-cols-5 border-t border-(--chrome-border) bg-[#FFFFFFF2] px-1 pt-2 pb-3.5 backdrop-blur-[10px] lg:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = isNavItemActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              // min-h-11 = 44px, o alvo de toque mínimo que o README
              // exige "sem exceção".
              "flex min-h-11 flex-col items-center justify-center gap-1.25 py-2 font-mono text-[9.5px]",
              isActive ? "text-(--chrome-ink)" : "text-(--chrome-faint)",
            )}
          >
            <Icon className="size-5" strokeWidth={1.4} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
