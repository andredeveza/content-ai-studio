import { notFound, redirect } from "next/navigation";
import { ProgressoScreen } from "@/components/progresso/progresso-screen";
import { getJobRepository } from "@/infra/pipeline/bootstrap";
import { getEditorRepositories } from "@/infra/editor/bootstrap";
import { getCurrentSession } from "@/lib/session";

interface ProgressoPageProps {
  readonly params: Promise<{ jobId: string }>;
}

export default async function ProgressoPage({ params }: ProgressoPageProps) {
  const { jobId } = await params;
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const jobs = getJobRepository();
  const job = await jobs.findById(jobId);
  if (!job || job.orgId !== session.orgId) notFound();

  const { projects, clients } = getEditorRepositories();
  const project = await projects.findById(session.orgId, job.projectId);
  // O @ do cliente aparece no cabeçalho do protótipo, ao lado do job id.
  const client = project ? await clients.findById(session.orgId, project.clientId) : null;

  return (
    <ProgressoScreen
      jobId={job.id}
      initialJob={{ step: job.step, progress: job.progress, state: job.state, error: job.error }}
      theme={project?.theme ?? null}
      handle={client?.handles[0] ?? null}
      editorHref={`/projects/${job.projectId}/editor`}
      geradorHref="/gerador"
    />
  );
}
