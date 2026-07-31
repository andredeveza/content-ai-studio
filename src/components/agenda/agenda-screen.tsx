"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { PostStatus } from "@/core/domain/post/post";
import { cn } from "@/lib/utils";

export interface AgendaPostData {
  readonly id: string;
  readonly projectId: string;
  readonly scheduledAt: string;
  readonly status: PostStatus;
  readonly theme: string;
  readonly handle: string | null;
}

export interface AgendaScreenProps {
  readonly monthLabel: string;
  readonly daysInMonth: number;
  readonly year: number;
  readonly month: number;
  readonly posts: readonly AgendaPostData[];
  readonly prevMonthHref: string;
  readonly nextMonthHref: string;
  readonly markPublishedAction: (postId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  readonly cancelScheduleAction: (postId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const DOW_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const STATUS_LABEL: Record<PostStatus, string> = {
  scheduled: "agendado",
  published: "publicado",
  failed: "falhou",
};

function statusColorVar(status: PostStatus): string {
  if (status === "published") return "var(--chrome-ok)";
  if (status === "failed") return "var(--destructive)";
  return "var(--chrome-ink)";
}

export function AgendaScreen({
  monthLabel,
  daysInMonth,
  year,
  month,
  posts: initialPosts,
  prevMonthHref,
  nextMonthHref,
  markPublishedAction,
  cancelScheduleAction,
}: AgendaScreenProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startAction] = useTransition();

  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month - 1, day);
      const dayPosts = posts.filter((post) => new Date(post.scheduledAt).getDate() === day);
      return { day, dow: DOW_LABELS[date.getDay()], dayPosts };
    });
  }, [daysInMonth, year, month, posts]);

  const visiblePosts = useMemo(() => {
    const sorted = [...posts].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
    if (selectedDay == null) return sorted;
    return sorted.filter((post) => new Date(post.scheduledAt).getDate() === selectedDay);
  }, [posts, selectedDay]);

  function pickDay(day: number): void {
    setSelectedDay((prev) => (prev === day ? null : day));
  }

  function handleMarkPublished(postId: string): void {
    setError(null);
    startAction(async () => {
      const result = await markPublishedAction(postId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, status: "published" } : post)));
    });
  }

  function handleCancel(postId: string): void {
    setError(null);
    startAction(async () => {
      const result = await cancelScheduleAction(postId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    });
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={prevMonthHref} className="px-1 text-(--chrome-muted)" aria-label="Mês anterior">
            ←
          </Link>
          <h1 className="text-[28px] font-bold tracking-[-.03em] leading-[1.1]">{monthLabel}</h1>
          <Link href={nextMonthHref} className="px-1 text-(--chrome-muted)" aria-label="Próximo mês">
            →
          </Link>
        </div>
        <div className="font-mono text-[10px] text-(--chrome-muted)">via export</div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="noscroll -mx-4 mb-6 flex gap-1.5 overflow-x-auto px-4">
        {days.map(({ day, dow, dayPosts }) => {
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => pickDay(day)}
              className={cn(
                "flex-none w-13 rounded-[10px] border py-2.5 text-center",
                isSelected ? "border-(--chrome-ink) bg-(--chrome-ink)" : "border-(--chrome-border) bg-(--chrome-surface)",
              )}
            >
              <div
                className="font-mono text-[9.5px] tracking-[.1em]"
                style={{ color: isSelected ? "var(--chrome-bg)" : "var(--chrome-muted)" }}
              >
                {dow}
              </div>
              <div
                className="mt-0.5 text-[17px] font-semibold"
                style={{ color: isSelected ? "var(--chrome-bg)" : "var(--chrome-ink)" }}
              >
                {day}
              </div>
              <div className="mt-1.5 flex h-1 justify-center gap-0.5">
                {dayPosts.slice(0, 3).map((post) => (
                  <span
                    key={post.id}
                    className="size-1 rounded-full"
                    style={{ background: isSelected ? "var(--chrome-bg)" : statusColorVar(post.status) }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-[.16em] text-(--chrome-muted)">
          {selectedDay == null ? "o mês inteiro" : `dia ${selectedDay}`}
        </div>
        {selectedDay != null && (
          <button
            type="button"
            onClick={() => setSelectedDay(null)}
            className="rounded-full border border-(--chrome-border) px-3 py-1.5 font-mono text-[10px] text-(--chrome-text)"
          >
            ver o mês
          </button>
        )}
      </div>

      {visiblePosts.length === 0 && (
        <div className="rounded-md border border-dashed border-(--chrome-border) p-6 text-center text-sm text-(--chrome-muted)">
          Nada agendado {selectedDay == null ? "neste mês" : "neste dia"}.
        </div>
      )}

      <div className="grid gap-2.5">
        {visiblePosts.map((post) => {
          const date = new Date(post.scheduledAt);
          return (
            <div key={post.id} className="grid grid-cols-[48px_1fr] items-start gap-3">
              <div className="pt-3 text-right">
                <div className="font-mono text-base font-bold text-(--chrome-ink)">{date.getDate()}</div>
                <div className="font-mono text-[9.5px] text-(--chrome-muted)">{DOW_LABELS[date.getDay()]}</div>
              </div>
              <div
                className="rounded-[9px] border border-(--chrome-border) bg-(--chrome-surface) p-3.5"
                style={{ borderLeft: `3px solid ${statusColorVar(post.status)}` }}
              >
                <div className="text-[15px] font-medium leading-[1.3]">{post.theme}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10.5px] text-(--chrome-muted)">
                  <span>{date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span>·</span>
                  <span style={{ color: statusColorVar(post.status) }}>{STATUS_LABEL[post.status]}</span>
                  {post.handle && (
                    <>
                      <span>·</span>
                      <span>{post.handle}</span>
                    </>
                  )}
                </div>
                {post.status === "scheduled" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleMarkPublished(post.id)}
                      className="rounded-md bg-(--chrome-ink) px-3 py-2 font-mono text-[11px] text-white"
                    >
                      marcar como publicado
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(post.id)}
                      className="rounded-md border border-(--chrome-border) px-3 py-2 font-mono text-[11px] text-(--chrome-text)"
                    >
                      cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
