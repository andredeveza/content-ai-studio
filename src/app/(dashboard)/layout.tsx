import { signOut } from "@/app/(auth)/actions";
import { LogoMark } from "@/components/brand/logo-mark";
import { TabBar } from "@/components/nav/tab-bar";

// Chrome do produto (design_handoff_content_ai_studio/README.md, seção
// "Chrome do produto"): fundo --chrome-bg por trás de todas as telas
// autenticadas, com a navegação por abas (gerador/projetos/agenda/marca)
// fixa no rodapé. Editor e Progresso são telas de fluxo (chegam a partir
// de Projetos/Gerador), não abas fixas.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-(--chrome-bg)">
      <div className="flex items-center justify-between px-4 pt-4">
        <LogoMark size="sm" />
        <form action={signOut}>
          <button type="submit" className="font-mono text-[10px] uppercase tracking-[.1em] text-(--chrome-muted)">
            Sair
          </button>
        </form>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
      <TabBar />
    </div>
  );
}
