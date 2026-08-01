import { notFound, redirect } from "next/navigation";
import { EditorScreen, type EditorSlideData } from "@/components/editor/editor-screen";
import { resolveEffectiveSlide } from "@/core/domain/project/slide";
import { getEditorRepositories } from "@/infra/editor/bootstrap";
import { getCurrentSession } from "@/lib/session";
import { exportProject, regenerateMedia, saveSlide, scheduleProject } from "./actions";

interface EditorPageProps {
  readonly params: Promise<{ projectId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { projectId } = await params;

  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const { projects, slides, clients, brandKits } = getEditorRepositories();

  const project = await projects.findById(session.orgId, projectId);
  if (!project) notFound();

  const client = await clients.findById(session.orgId, project.clientId);
  const brandKit = client ? await brandKits.findByClientId(client.id) : null;
  if (!client || !brandKit) notFound();

  const projectSlides = await slides.listByProject(project.id);
  if (projectSlides.length === 0) notFound();

  const editorSlides: EditorSlideData[] = projectSlides.map((slide) => {
    const effective = resolveEffectiveSlide(slide);
    return {
      id: slide.id,
      index: slide.index,
      archetypeId: effective.archetypeId,
      content: effective.content,
      variant: slide.variant,
    };
  });

  return (
    <EditorScreen
      ratio={project.ratio}
      styleId={project.styleId}
      brandKit={brandKit}
      slides={editorSlides}
      lastIndex={project.slideCount - 1}
      saveSlideAction={saveSlide.bind(null, session.orgId)}
      regenerateMediaAction={regenerateMedia.bind(null, session.orgId)}
      exportProjectAction={exportProject.bind(null, session.orgId, project.id)}
      scheduleProjectAction={scheduleProject.bind(null, session.orgId, project.id)}
      canSchedule={project.status === "completed"}
    />
  );
}
