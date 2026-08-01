import { redirect } from "next/navigation";
import { Workflow } from "lucide-react";
import Link from "next/link";
import { ScreenContainer } from "@/components/chrome/screen-container";
import { getJobRepository } from "@/infra/pipeline/bootstrap";
import { getCurrentSession } from "@/lib/session";

// Aba "geração" do protótipo. No handoff é uma tela fixa porque a demo
// tem um job só; aqui resolve para o job mais recente da org — que é o
// que o usuário quer dizer com "me leva de volta pro que eu estava
// acompanhando".
export default async function ProgressoIndexPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const job = await getJobRepository().findLatestByOrg(session.orgId);
  if (job) redirect(`/progresso/${job.id}`);

  return (
    <ScreenContainer width="form" className="pt-7 pb-10">
      <div className="grid gap-3 rounded-[11px] border border-(--chrome-border) bg-(--chrome-surface) px-5 py-8 text-center">
        <Workflow className="mx-auto size-6 text-(--chrome-faint)" strokeWidth={1.4} />
        <p className="text-[15px] font-medium">Nenhuma geração ainda.</p>
        <p className="text-sm text-(--chrome-muted)">Escreva um tema no Gerador e a barra de progresso aparece aqui.</p>
        <Link
          href="/gerador"
          className="mx-auto mt-2 flex min-h-11 items-center rounded-[10px] bg-(--chrome-terminal) px-5 text-[15.5px] font-semibold text-white"
        >
          Ir para o Gerador
        </Link>
      </div>
    </ScreenContainer>
  );
}
