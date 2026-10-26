"use server";

import { requireProfile } from "@/lib/auth";
import {
  mergeRanges,
  sumRanges,
  watchedPct,
  WATCH_THRESHOLD,
} from "@/lib/learning";
import { getRepo } from "@/lib/repo";
import { loadStudentViews } from "@/lib/student";
import type { Range } from "@/lib/types";

export type SaveProgressResult =
  | { ok: true; watchedSeconds: number; watchedPct: number; videoDone: boolean }
  | { ok: false; error: string };

const MAX_RANGES = 60;
// O vídeo pode rodar até 2x. Damos uma folga pequena para atrasos de rede.
const MAX_SPEED = 2.05;
const SLACK_SECONDS = 15;
const FIRST_SAVE_SECONDS = 30;

// Recebe os trechos que o aluno acabou de assistir e soma ao que já estava salvo.
// Recusa "assistir" mais segundos do que o tempo real que passou (anti-trapaça).
export async function saveWatchProgress(
  lessonId: string,
  incoming: Range[],
  lastPosition: number,
): Promise<SaveProgressResult> {
  const profile = await requireProfile("aluno");
  const repo = getRepo();

  const views = await loadStudentViews(profile.id);
  const lesson = views.find((v) => v.id === lessonId);
  if (!lesson || !lesson.unlocked) return { ok: false, error: "Aula não disponível." };

  const duration = lesson.duration_seconds;
  if (duration <= 0) return { ok: false, error: "Duração da aula não configurada." };

  if (!Array.isArray(incoming) || incoming.length > MAX_RANGES) {
    return { ok: false, error: "Dados inválidos." };
  }
  const clean: Range[] = [];
  for (const item of incoming) {
    if (!Array.isArray(item) || item.length !== 2) return { ok: false, error: "Dados inválidos." };
    const a = Math.floor(Number(item[0]));
    const b = Math.ceil(Number(item[1]));
    if (!Number.isFinite(a) || !Number.isFinite(b)) return { ok: false, error: "Dados inválidos." };
    const start = Math.max(0, a);
    const end = Math.min(duration, b);
    if (end > start) clean.push([start, end]);
  }

  const [existing] = (await repo.getProgress(profile.id)).filter((p) => p.lesson_id === lessonId);
  const now = Date.now();
  const previousRanges = existing?.ranges ?? [];
  const merged = mergeRanges([...previousRanges, ...clean]);
  const watchedSeconds = Math.min(duration, sumRanges(merged));
  const gained = watchedSeconds - (existing?.watched_seconds ?? 0);

  const elapsed = existing
    ? (now - new Date(existing.updated_at).getTime()) / 1000
    : FIRST_SAVE_SECONDS;
  if (gained > elapsed * MAX_SPEED + SLACK_SECONDS) {
    return { ok: false, error: "Progresso recusado: mais tempo assistido do que o tempo real." };
  }

  const pct = watchedPct(watchedSeconds, duration);
  const videoDone = pct >= WATCH_THRESHOLD;
  const position = Math.min(duration, Math.max(0, Math.floor(Number(lastPosition) || 0)));

  await repo.saveProgress({
    user_id: profile.id,
    lesson_id: lessonId,
    ranges: merged,
    watched_seconds: watchedSeconds,
    last_position: position,
    completed_at: existing?.completed_at ?? (videoDone ? new Date(now).toISOString() : null),
    updated_at: new Date(now).toISOString(),
  });

  return { ok: true, watchedSeconds, watchedPct: pct, videoDone };
}
