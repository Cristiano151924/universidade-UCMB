import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { formatDuration, pctText, summarize, type LessonView } from "@/lib/learning";
import { loadStudentViews } from "@/lib/student";
import { CheckIcon, LockIcon, PlayIcon, ProgressBar, StatusBadge } from "@/components/ui";

function LessonRow({ lesson }: { lesson: LessonView }) {
  const locked = !lesson.unlocked;
  const done = lesson.status === "passed" || lesson.status === "failed";

  const icon = locked ? (
    <LockIcon className="h-5 w-5" />
  ) : done ? (
    <CheckIcon className="h-5 w-5" />
  ) : (
    <PlayIcon className="h-5 w-5" />
  );

  const circle = locked
    ? "bg-zinc-100 text-zinc-500"
    : lesson.status === "passed"
      ? "bg-emerald-100 text-emerald-700"
      : lesson.status === "failed"
        ? "bg-red-100 text-red-700"
        : "bg-brand text-white";

  const content = (
    <div className="flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${circle}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{lesson.title}</p>
          <StatusBadge status={lesson.status} />
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {formatDuration(lesson.duration_seconds)}
          {lesson.bestScore !== null && ` · melhor nota no quiz: ${lesson.bestScore}/3`}
          {locked && " · conclua a aula anterior para liberar"}
        </p>
        {!locked && (
          <div className="mt-2 flex items-center gap-3">
            <ProgressBar value={lesson.watchedPct} className="max-w-xs" />
            <span className="text-xs text-muted">{pctText(lesson.watchedPct)}</span>
          </div>
        )}
      </div>
      {!locked && (
        <span className="btn btn-primary hidden sm:inline-flex">
          {lesson.status === "available" ? "Começar" : done ? "Rever" : "Continuar"}
        </span>
      )}
    </div>
  );

  if (locked) {
    return <div className="card opacity-70">{content}</div>;
  }
  return (
    <Link
      href={`/aluno/aula/${lesson.id}`}
      className="card block transition hover:border-brand/40 hover:shadow-md"
    >
      {content}
    </Link>
  );
}

export default async function AlunoHome() {
  const profile = await requireProfile("aluno");
  const views = await loadStudentViews(profile.id);
  const summary = summarize(views);

  const modules = [...new Set(views.map((v) => v.module_id))].map((moduleId) => {
    const lessons = views.filter((v) => v.module_id === moduleId);
    return { id: moduleId, title: lessons[0].module_title, lessons };
  });

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-brand p-6 text-white">
        <p className="text-sm text-white/80">Bem-vindo(a) de volta</p>
        <h1 className="mt-0.5 text-2xl font-semibold">Olá, {profile.full_name.split(" ")[0]}!</h1>
        <div className="mt-4 max-w-md">
          <div className="mb-1.5 flex justify-between text-sm">
            <span>
              {summary.lessonsDone} de {summary.lessonsTotal} aulas concluídas
            </span>
            <span className="font-semibold">{pctText(summary.completionPct)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: pctText(summary.completionPct) }}
            />
          </div>
        </div>
      </div>

      {modules.length === 0 && (
        <p className="card text-sm text-muted">Nenhuma aula foi liberada ainda.</p>
      )}

      {modules.map((mod) => {
        const doneCount = mod.lessons.filter((l) => l.done).length;
        return (
          <section key={mod.id} className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">{mod.title}</h2>
              <span className="text-sm text-muted">
                {doneCount}/{mod.lessons.length} concluídas
              </span>
            </div>
            <div className="space-y-3">
              {mod.lessons.map((lesson) => (
                <LessonRow key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
