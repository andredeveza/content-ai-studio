import { redirect } from "next/navigation";
import { ProjetosScreen } from "@/components/projetos/projetos-screen";
import { getListProjectsUseCase } from "@/infra/pipeline/bootstrap";
import { getCurrentSession } from "@/lib/session";

export default async function ProjetosPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const projects = await getListProjectsUseCase().execute(session.orgId);

  return (
    <ProjetosScreen
      projects={projects.map((project) => ({
        id: project.id,
        theme: project.theme,
        status: project.status,
        progress: project.progress,
        slideCount: project.slideCount,
        ratio: project.ratio,
        createdAt: project.createdAt,
      }))}
      geradorHref="/gerador"
    />
  );
}
