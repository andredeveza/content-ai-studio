import { redirect } from "next/navigation";
import { AgendaScreen } from "@/components/agenda/agenda-screen";
import { getAgendaRepositories } from "@/infra/agenda/bootstrap";
import { getCurrentSession } from "@/lib/session";
import { cancelSchedule, markPublished } from "./actions";

interface AgendaPageProps {
  readonly searchParams: Promise<{ month?: string }>;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function parseMonthParam(value: string | undefined): { year: number; month: number } {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    if (year && month && month >= 1 && month <= 12) return { year, month };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function monthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const { month: monthQuery } = await searchParams;
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const { year, month } = parseMonthParam(monthQuery);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStart = new Date(year, month - 1, 1).toISOString();
  const monthEnd = new Date(year, month, 1).toISOString();

  const { posts } = getAgendaRepositories();
  const calendarPosts = await posts.listForCalendar(session.orgId, monthStart, monthEnd);

  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);

  return (
    <AgendaScreen
      monthLabel={`${MONTH_NAMES[month - 1]} ${year}`}
      daysInMonth={daysInMonth}
      year={year}
      month={month}
      posts={calendarPosts}
      prevMonthHref={`/agenda?month=${monthParam(prevDate.getFullYear(), prevDate.getMonth() + 1)}`}
      nextMonthHref={`/agenda?month=${monthParam(nextDate.getFullYear(), nextDate.getMonth() + 1)}`}
      markPublishedAction={markPublished.bind(null, session.orgId)}
      cancelScheduleAction={cancelSchedule.bind(null, session.orgId)}
    />
  );
}
