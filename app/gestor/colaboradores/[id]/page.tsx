import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { buildLessonViews, formatDuration, pctText, summarize } from "@/lib/learning";
import { getRepo } from "@/lib/repo";
import { ProgressBar, StatusBadge } from "@/components/ui";

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function ColaboradorDetalhe({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile("gestor");
  const { id } = await params;
  const repo = getRepo();

  const person = await repo.getCollaborator(id);
  if (!person) notFound();

  const [catalog, progress, attempts] = await Promise.all([
    repo.getCatalog(),
    repo.getProgress(id),
    repo.getAttempts(id),
  ]);
  const views = buildLessonViews(catalog, progress, attempts);
  const summary = summarize(views);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/gestor" className="text-sm text-brand hover:underline">
          ← Painel geral
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{person.full_name}</h1>
        <p className="mt-1 text-sm text-muted">
          Usuário <span className="font-mono">{person.username}</span> ·{" "}
          {person.active ? "ativo" : "desativado"} · último acesso:{" "}
          {person.last_seen_at ? dateFormat.format(new Date(person.last_seen_at)) : "nunca entrou"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-muted">Aulas concluídas</p>
          <p className="mt-1 text-3xl font-semibold text-brand">
            {summary.lessonsDone}/{summary.lessonsTotal}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-muted">Progresso nas aulas</p>
          <p className="mt-1 text-3xl font-semibold text-brand">{pctText(summary.completionPct)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted">Nota média nos quizzes</p>
          <p className="mt-1 text-3xl font-semibold text-brand">
            {summary.avgScorePct === null ? "—" : pctText(summary.avgScorePct)}
          </p>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="px-4 py-3 font-medium">Aula</th>
              <th className="px-4 py-3 font-medium">Assistido</th>
              <th className="px-4 py-3 font-medium">Quiz (tentativas)</th>
              <th className="px-4 py-3 font-medium">Situação</th>
            </tr>
          </thead>
          <tbody>
            {views.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Ainda não há aulas cadastradas.
                </td>
              </tr>
            )}
            {views.map((lesson) => (
              <tr key={lesson.id} className="border-b border-line align-top last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{lesson.title}</p>
                  <p className="text-xs text-muted">
                    {lesson.module_title} · {formatDuration(lesson.duration_seconds)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={lesson.watchedPct} showMark className="w-28" />
                    <span className="text-xs text-muted">{pctText(lesson.watchedPct)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {lesson.attempts.length === 0 ? (
                    <span className="text-muted">Nenhuma tentativa</span>
                  ) : (
                    <ul className="flex flex-wrap gap-1.5">
                      {lesson.attempts.map((a) => (
                        <li
                          key={a.id}
                          title={dateFormat.format(new Date(a.created_at))}
                          className={`rounded-md px-2 py-0.5 text-xs ${a.passed ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-700"}`}
                        >
                          {a.attempt_number}ª: {a.score}/{a.total}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={lesson.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
