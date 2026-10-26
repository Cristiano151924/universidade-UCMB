import type { Attempt, Catalog, Lesson, Progress, Range } from "./types";

// Regras do curso (combinadas com o gestor).
export const WATCH_THRESHOLD = 0.9; // % da aula para liberar o quiz
export const MAX_ATTEMPTS = 3;
export const QUESTIONS_PER_SET = 3;
export const PASS_SCORE = 2; // acertos (de 3) para ser aprovado

export type LessonStatus =
  | "locked" // aula anterior ainda não concluída
  | "available" // liberada, ainda não começou
  | "in_progress" // assistindo
  | "quiz_pending" // assistiu 90%+ e falta passar no quiz
  | "passed" // concluída
  | "failed"; // usou as 3 tentativas sem passar (a próxima aula libera mesmo assim)

export const STATUS_LABEL: Record<LessonStatus, string> = {
  locked: "Bloqueada",
  available: "Não iniciada",
  in_progress: "Em andamento",
  quiz_pending: "Falta o quiz",
  passed: "Concluída",
  failed: "Reprovada no quiz",
};

export type LessonView = Lesson & {
  module_title: string;
  index: number;
  watchedSeconds: number;
  watchedPct: number; // 0 a 1
  lastPosition: number;
  videoDone: boolean;
  attempts: Attempt[];
  attemptsUsed: number;
  passedQuiz: boolean;
  exhausted: boolean;
  bestScore: number | null;
  done: boolean;
  unlocked: boolean;
  status: LessonStatus;
};

export function watchedPct(watchedSeconds: number, duration: number): number {
  if (duration <= 0) return 0;
  return Math.min(1, watchedSeconds / duration);
}

// Junta trechos que se tocam: [[0,10],[8,20]] -> [[0,20]]
export function mergeRanges(ranges: Range[]): Range[] {
  const sorted = ranges
    .filter(([a, b]) => b > a)
    .map(([a, b]) => [a, b] as Range)
    .sort((x, y) => x[0] - y[0]);
  const merged: Range[] = [];
  for (const [a, b] of sorted) {
    const last = merged[merged.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  }
  return merged;
}

export function sumRanges(ranges: Range[]): number {
  return ranges.reduce((total, [a, b]) => total + (b - a), 0);
}

// Cruza catálogo + progresso + tentativas de UMA pessoa e decide o estado de cada aula.
export function buildLessonViews(
  catalog: Catalog,
  progress: Progress[],
  attempts: Attempt[],
): LessonView[] {
  const modules = [...catalog.modules].sort((a, b) => a.position - b.position);
  const ordered: { lesson: Lesson; moduleTitle: string }[] = [];
  for (const mod of modules) {
    catalog.lessons
      .filter((l) => l.module_id === mod.id)
      .sort((a, b) => a.position - b.position)
      .forEach((lesson) => ordered.push({ lesson, moduleTitle: mod.title }));
  }

  const views: LessonView[] = [];
  ordered.forEach(({ lesson, moduleTitle }, index) => {
    const prog = progress.find((p) => p.lesson_id === lesson.id);
    const lessonAttempts = attempts
      .filter((a) => a.lesson_id === lesson.id)
      .sort((a, b) => a.attempt_number - b.attempt_number);

    const watchedSeconds = prog?.watched_seconds ?? 0;
    const pct = watchedPct(watchedSeconds, lesson.duration_seconds);
    const videoDone = lesson.duration_seconds > 0 && pct >= WATCH_THRESHOLD;
    const passedQuiz = lessonAttempts.some((a) => a.passed);
    const exhausted = !passedQuiz && lessonAttempts.length >= MAX_ATTEMPTS;
    const done = videoDone && (!lesson.quiz_ready || passedQuiz || exhausted);
    const unlocked = index === 0 || views[index - 1].done;
    const bestScore = lessonAttempts.length ? Math.max(...lessonAttempts.map((a) => a.score)) : null;

    let status: LessonStatus;
    if (!unlocked) status = "locked";
    else if (done) status = exhausted ? "failed" : "passed";
    else if (videoDone) status = "quiz_pending";
    else if (watchedSeconds > 0) status = "in_progress";
    else status = "available";

    views.push({
      ...lesson,
      module_title: moduleTitle,
      index,
      watchedSeconds,
      watchedPct: pct,
      lastPosition: prog?.last_position ?? 0,
      videoDone,
      attempts: lessonAttempts,
      attemptsUsed: lessonAttempts.length,
      passedQuiz,
      exhausted,
      bestScore,
      done,
      unlocked,
      status,
    });
  });
  return views;
}

export type StudentSummary = {
  lessonsDone: number;
  lessonsTotal: number;
  completionPct: number; // 0 a 1, média do % assistido de todas as aulas
  avgScorePct: number | null; // 0 a 1, média da melhor nota de cada aula com quiz feito
  failedLessons: number;
};

export function summarize(views: LessonView[]): StudentSummary {
  const lessonsTotal = views.length;
  const scored = views.filter((v) => v.bestScore !== null);
  return {
    lessonsDone: views.filter((v) => v.done).length,
    lessonsTotal,
    completionPct: lessonsTotal ? views.reduce((s, v) => s + v.watchedPct, 0) / lessonsTotal : 0,
    avgScorePct: scored.length
      ? scored.reduce((s, v) => s + (v.bestScore ?? 0) / QUESTIONS_PER_SET, 0) / scored.length
      : null,
    failedLessons: views.filter((v) => v.status === "failed").length,
  };
}

export function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function pctText(value: number): string {
  return `${Math.round(value * 100)}%`;
}
