import { signOut } from "@/app/(auth)/actions";
import { MobileTopBar } from "@/components/nav/mobile-top-bar";
import { Sidebar } from "@/components/nav/sidebar";
import { TabBar } from "@/components/nav/tab-bar";
import { aiConfig } from "@/config/ai";

// Chrome do produto, agora com os DOIS shells do handoff:
// - mobile (`Protótipo AD Mobile.dc.html`): top bar sticky + tab bar de
//   5 itens, largura máxima 430px com filetes laterais;
// - desktop (`Protótipo AD.dc.html`): `grid-template-columns:236px 1fr`
//   com sidebar sticky de altura total.
//
// Antes existia só a tab bar mobile, mostrada em qualquer largura — o
// desktop não era um layout, era o mobile esticado.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Estado real das capabilities (config/ai.ts), não rótulo decorativo:
  // o protótipo mostra "texto kimi ✓ / imagem hf ✓ / visão gemini ~".
  const providers = (["text", "image", "vision"] as const).map((capability) => {
    const active = aiConfig.fallbackOrder[capability].find((slot) => slot.enabled);
    const first = aiConfig.fallbackOrder[capability][0];
    return {
      label: capability === "text" ? "texto" : capability === "image" ? "imagem" : "visão",
      value: active?.id ?? first?.id ?? "—",
      ok: Boolean(active),
    };
  });

  return (
    <div className="flex flex-1 bg-(--chrome-bg)">
      <Sidebar signOutAction={signOut} providers={providers} />

      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col border-x border-(--chrome-border) lg:mx-0 lg:max-w-none lg:border-x-0">
        <MobileTopBar signOutAction={signOut} />
        {/* pb-21.5 ≈ os 86px de `padding-bottom` do main no protótipo:
            a tab bar é sticky e flutua por cima, então sem isso o fim do
            conteúdo fica permanentemente escondido atrás dela. */}
        <div className="flex-1 pb-21.5 lg:pb-0">{children}</div>
        <TabBar />
      </div>
    </div>
  );
}
