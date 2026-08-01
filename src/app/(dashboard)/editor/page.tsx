import { redirect } from "next/navigation";
import { Shapes } from "lucide-react";
import Link from "next/link";
import { ScreenContainer } from "@/components/chrome/screen-container";
import { getEditorRepositories } from "@/infra/editor/bootstrap";
import { getCurrentSession } from "@/lib/session";

// Aba "editor" do protótipo: resolve para o carrossel pronto mais
// recente. Só projeto `completed` tem slides renderizados para editar.
export default async function EditorIndexPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const { projects } = getEditorRepositories();
  const all = await projects.listByOrg(session.orgId);
  const latest = all
    .filter((project) => project.status === "completed")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (latest) redirect(`/projects/${latest.id}/editor`);

  return (
    <ScreenContainer width="form" className="pt-7 pb-10">
      <div className="grid gap-3 rounded-[11px] border border-(--chrome-border) bg-(--chrome-surface) px-5 py-8 text-center">
        <Shapes className="mx-auto size-6 text-(--chrome-faint)" strokeWidth={1.4} />
        <p className="text-[15px] font-medium">Nenhum carrossel pronto para editar.</p>
        <p className="text-sm text-(--chrome-muted)">Assim que uma geração terminar, ela abre aqui.</p>
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
