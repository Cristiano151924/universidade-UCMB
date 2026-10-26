"use client";

import { useState } from "react";
import type { SaveProgressResult } from "@/app/actions/progress";
import Quiz, { type AttemptSummary } from "@/components/Quiz";
import { ProgressBar } from "@/components/ui";
import YouTubePlayer from "@/components/YouTubePlayer";
import { pctText, WATCH_THRESHOLD } from "@/lib/learning";

type Props = {
  lessonId: string;
  youtubeId: string;
  lastPosition: number;
  initialPct: number; // 0 a 1
  quizReady: boolean;
  attempts: AttemptSummary[];
  passedQuiz: boolean;
  exhausted: boolean;
};

export default function LessonClient({
  lessonId,
  youtubeId,
  lastPosition,
  initialPct,
  quizReady,
  attempts,
  passedQuiz,
  exhausted,
}: Props) {
  // Onde o vídeo recomeça: só vale a posição de quando a página abriu.
  const [startAt] = useState(lastPosition);
  const [pct, setPct] = useState(initialPct);
  const [warning, setWarning] = useState<string | null>(null);

  function handleSaved(result: SaveProgressResult) {
    if (result.ok) {
      setWarning(null);
      setPct((current) => Math.max(current, result.watchedPct));
    } else {
      setWarning(result.error);
    }
  }

  const videoDone = pct >= WATCH_THRESHOLD;

  return (
    <div className="space-y-6">
      <div className="card space-y-4 p-3 sm:p-4">
        <YouTubePlayer
          lessonId={lessonId}
          videoId={youtubeId}
          startAt={startAt}
          onSaved={handleSaved}
        />
        <div className="px-1 pb-1">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium">Seu progresso na aula</span>
            <span className={videoDone ? "font-semibold text-emerald-700" : "text-muted"}>
              {pctText(pct)}
              {videoDone ? " · quiz liberado" : ` · o quiz libera aos ${WATCH_THRESHOLD * 100}%`}
            </span>
          </div>
          <ProgressBar value={pct} showMark />
          <p className="mt-2 text-xs text-muted">
            Contamos só o que você realmente assiste. Pular trechos do vídeo não conta.
          </p>
          {warning && (
            <p role="alert" className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {warning}
            </p>
          )}
        </div>
      </div>

      <Quiz
        lessonId={lessonId}
        quizReady={quizReady}
        videoDone={videoDone}
        watchedPct={pct}
        attempts={attempts}
        passedQuiz={passedQuiz}
        exhausted={exhausted}
      />
    </div>
  );
}
