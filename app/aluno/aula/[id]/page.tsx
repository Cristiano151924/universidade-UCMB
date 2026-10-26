import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { formatDuration } from "@/lib/learning";
import { loadStudentViews } from "@/lib/student";
import { StatusBadge } from "@/components/ui";
import LessonClient from "./LessonClient";

export default async function AulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile("aluno");

  const views = await loadStudentViews(profile.id);
  const lesson = views.find((v) => v.id === id);
  if (!lesson) notFound();
  if (!lesson.unlocked) redirect("/aluno");

  const next = views[lesson.index + 1];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/aluno" className="text-sm text-brand hover:underline">
          ← Minhas aulas
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {lesson.module_title}: {lesson.title}
          </h1>
          <StatusBadge status={lesson.status} />
        </div>
        <p className="mt-1 text-sm text-muted">Duração: {formatDuration(lesson.duration_seconds)}</p>
      </div>

      <LessonClient
        lessonId={lesson.id}
        youtubeId={lesson.youtube_id}
        lastPosition={lesson.lastPosition}
        initialPct={lesson.watchedPct}
        quizReady={lesson.quiz_ready}
        attempts={lesson.attempts.map((a) => ({
          number: a.attempt_number,
          score: a.score,
          total: a.total,
          passed: a.passed,
        }))}
        passedQuiz={lesson.passedQuiz}
        exhausted={lesson.exhausted}
      />

      <div className="card">
        <h2 className="text-lg font-semibold">Material de apoio</h2>
        <p className="mt-1 text-sm text-muted">Nenhum material foi anexado a esta aula.</p>
      </div>

      {next && (
        <div className="flex justify-end">
          {next.unlocked ? (
            <Link href={`/aluno/aula/${next.id}`} className="btn btn-primary">
              Próxima aula: {next.title} →
            </Link>
          ) : (
            <span className="text-sm text-muted">
              A próxima aula ({next.title}) abre quando você concluir esta.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
