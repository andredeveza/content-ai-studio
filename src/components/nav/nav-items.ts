import { CalendarDays, Palette, Shapes, Terminal, Workflow } from "lucide-react";

// Os 5 itens do protótipo, com os rótulos e ícones LITERAIS do handoff
// (`design/Content AI Studio - Protótipo AD Mobile.dc.html`, linha 395:
// `grid-template-columns:repeat(5,1fr)`).
//
// O que existia antes não vinha de lugar nenhum do design: 4 itens
// capitalizados, ícone de sparkles no Gerador, e uma aba "Projetos" que
// não está em nenhum protótipo. Projetos é o botão de pasta no topo
// (mesmo arquivo, linha 44: `goProjetos` com ícone `folder`).
//
// "geração" e "editor" precisam de um job/projeto concreto — no
// protótipo, que é demo de cliente único, eles sempre existem. Aqui as
// rotas-índice resolvem para o trabalho mais recente da org, que é o que
// o usuário espera de "me leva de volta pro que eu estava fazendo".
export const NAV_ITEMS = [
  { href: "/gerador", label: "gerador", icon: Terminal },
  { href: "/progresso", label: "geração", icon: Workflow },
  { href: "/editor", label: "editor", icon: Shapes },
  { href: "/agenda", label: "agenda", icon: CalendarDays },
  { href: "/marca", label: "marca", icon: Palette },
] as const;

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/editor") {
    // O editor real mora em /projects/[id]/editor.
    return pathname === "/editor" || pathname.startsWith("/projects/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
