"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useProfile } from "@/components/providers";
import { Badge, Button, ErrorBox, PageHeader, Panel, Spinner, cx } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { LANGUAGES, LEVELS, LEVEL_DESCRIPTIONS, type Level } from "@/lib/languages";
import type { CourseOverview } from "@/lib/course";

export default function CoursePage() {
  const { lang, refresh } = useProfile();
  const [course, setCourse] = useState<CourseOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setCourse(await api<CourseOverview>(`/api/course?lang=${lang}`));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [lang]);

  useEffect(() => {
    setCourse(null);
    void load();
  }, [load]);

  async function place(level: Level) {
    setBusy(true);
    try {
      setCourse(await api<CourseOverview>("/api/course/start", { method: "POST", body: { lang, level } }));
      void refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function skip(unitId: string) {
    setBusy(true);
    try {
      setCourse(await api<CourseOverview>("/api/course/skip", { method: "POST", body: { lang, unitId } }));
      void refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (error && !course) return <ErrorBox message={error} onRetry={() => void load()} />;
  if (!course) return <Spinner label="Chargement du parcours…" />;

  const info = LANGUAGES[lang];

  if (!course.placed) {
    const levels = lang === "fr" ? LEVELS.filter((l) => l !== "A1" && l !== "A2") : LEVELS.filter((l) => l !== "C1");
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title={`Ton parcours en ${info.name.toLowerCase()}`}
          subtitle="Par où commencer ? Les unités en dessous de ton niveau seront marquées comme acquises (tu pourras y revenir)."
        />
        <div className="space-y-3">
          {levels.map((l) => (
            <button
              key={l}
              disabled={busy}
              onClick={() => void place(l)}
              className="flex w-full items-center gap-4 rounded-2xl border-2 border-stone-200 bg-white p-4 text-left transition hover:border-[var(--accent)] disabled:opacity-50"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] font-bold text-[var(--accent-strong)]">
                {l}
              </span>
              <span className="text-stone-700">{LEVEL_DESCRIPTIONS[l]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const pct = Math.round((course.done / course.total) * 100);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Parcours · ${info.name}`}
        subtitle="Chaque leçon : des mots, une règle expliquée, un dialogue et des exercices. Les mots appris rejoignent tes révisions."
      />

      <Panel className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-stone-500">
              {course.done} leçons terminées sur {course.total}
            </p>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {course.next && (
            <Link
              href={`/parcours/${course.next.id}`}
              className="inline-flex rounded-xl bg-[var(--accent)] px-5 py-2.5 font-semibold text-white shadow-sm hover:brightness-110"
            >
              Continuer : {course.next.title} →
            </Link>
          )}
        </div>
      </Panel>

      {error && (
        <div className="mb-4">
          <ErrorBox message={error} />
        </div>
      )}

      <ol className="space-y-10">
        {course.units.map((unit) => {
          const finished = unit.lessons.filter((l) => l.status === "done" || l.status === "skipped").length;
          const complete = finished === unit.lessons.length;
          const allSkipped = unit.lessons.every((l) => l.status === "skipped");
          return (
            <li key={unit.id}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="accent">{unit.level}</Badge>
                    {complete && <Badge tone={allSkipped ? "neutral" : "good"}>{allSkipped ? "Passée" : "Terminée"}</Badge>}
                  </div>
                  <h2 className="mt-1 text-xl font-bold">{unit.title}</h2>
                  <p className="text-sm text-stone-600">{unit.description}</p>
                </div>
                {!complete && (
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => void skip(unit.id)}>
                    Je connais déjà → passer
                  </Button>
                )}
              </div>

              <ol className="relative ml-5 space-y-3 border-l-2 border-stone-200 pl-8">
                {unit.lessons.map((lesson) => {
                  const open = lesson.status !== "locked";
                  const node = (
                    <div
                      className={cx(
                        "flex items-center gap-4 rounded-2xl border p-4 transition",
                        lesson.status === "current" && "border-[var(--accent)] bg-white shadow-md ring-4 ring-[var(--accent-soft)]",
                        lesson.status === "done" && "border-emerald-200 bg-white hover:shadow-sm",
                        lesson.status === "skipped" && "border-stone-200 bg-white/60 hover:shadow-sm",
                        lesson.status === "locked" && "border-stone-200 bg-stone-50 text-stone-400",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={cx("font-semibold", lesson.status === "locked" ? "text-stone-400" : "text-stone-900")}>
                          {lesson.review ? "🔁 " : ""}
                          {lesson.title}
                        </p>
                        <p className="text-sm text-stone-500">{lesson.goal}</p>
                      </div>
                      {lesson.status === "done" && <Badge tone="good">{lesson.bestScore} %</Badge>}
                      {lesson.status === "skipped" && <Badge>passée</Badge>}
                      {lesson.status === "current" && (
                        <span className="rounded-xl bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white">Commencer</span>
                      )}
                    </div>
                  );
                  return (
                    <li key={lesson.id} className="relative">
                      <span
                        className={cx(
                          "absolute -left-[45px] top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border-2 text-xs font-bold",
                          lesson.status === "done" && "border-emerald-500 bg-emerald-500 text-white",
                          lesson.status === "skipped" && "border-stone-300 bg-stone-200 text-stone-500",
                          lesson.status === "current" && "border-[var(--accent)] bg-white text-[var(--accent-strong)]",
                          lesson.status === "locked" && "border-stone-200 bg-stone-50 text-stone-400",
                        )}
                        aria-hidden
                      >
                        {lesson.status === "done" ? "✓" : lesson.status === "locked" ? "🔒" : lesson.status === "skipped" ? "–" : "●"}
                      </span>
                      {open ? <Link href={`/parcours/${lesson.id}`}>{node}</Link> : node}
                    </li>
                  );
                })}
              </ol>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
