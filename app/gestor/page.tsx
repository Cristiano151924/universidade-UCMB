import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { buildLessonViews, daysSince, pctText, summarize } from "@/lib/learning";
import { getRepo } from "@/lib/repo";
import { ProgressBar } from "@/components/ui";

function lastSeenText(iso: string | null): string {
  const days = daysSince(iso);
  if (days === null) return "Nunca entrou";
  if (days <= 0) return "Hoje";
  if (days === 1) return "Ontem";
  return `Há ${days} dias`;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-brand">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default async function GestorHome() {
  const profile = await requireProfile("gestor");
  const repo = getRepo();

  const [collaborators, catalog, progress, attempts] = await Promise.all([
    repo.listCollaborators(),
    repo.getCatalog(),
    repo.getProgress(),
    repo.getAttempts(),
  ]);

  const rows = collaborators.map((person) => {
    const views = buildLessonViews(
      catalog,
      progress.filter((p) => p.user_id === person.id),
      attempts.filter((a) => a.user_id === person.id),
    );
    return { person, summary: summarize(views) };
  });

  const active = rows.filter((r) => r.person.active);
  const avgCompletion = active.length
    ? active.reduce((s, r) => s + r.summary.completionPct, 0) / active.length
    : 0;
  const scored = active.filter((r) => r.summary.avgScorePct !== null);
  const avgScore = scored.length
    ? scored.reduce((s, r) => s + (r.summary.avgScorePct ?? 0), 0) / scored.length
    : null;
  const stalled = active.filter((r) => {
    const days = daysSince(r.person.last_seen_at);
    return days === null || days > 7;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Painel geral</h1>
        <p className="mt-1 text-sm text-muted">
          Olá, {profile.full_name}. Veja como cada colaborador está nas aulas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Colaboradores ativos" value={String(active.length)} />
        <StatCard label="Aulas assistidas (média)" value={pctText(avgCompletion)} />
        <StatCard
          label="Nota média nos quizzes"
          value={avgScore === null ? "—" : pctText(avgScore)}
          hint="Melhor nota de cada aula"
        />
        <StatCard label="Sem entrar há +7 dias" value={String(stalled)} hint="Inclui quem nunca entrou" />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="px-4 py-3 font-medium">Colaborador</th>
              <th className="px-4 py-3 font-medium">Progresso</th>
              <th className="px-4 py-3 font-medium">Aulas concluídas</th>
              <th className="px-4 py-3 font-medium">Nota média</th>
              <th className="px-4 py-3 font-medium">Reprovações</th>
              <th className="px-4 py-3 font-medium">Último acesso</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Nenhum colaborador ainda.{" "}
                  <Link href="/gestor/colaboradores" className="text-brand hover:underline">
                    Cadastrar o primeiro
                  </Link>
                </td>
              </tr>
            )}
            {rows.map(({ person, summary }) => (
              <tr
                key={person.id}
                className={`border-b border-line last:border-0 ${person.active ? "" : "opacity-55"}`}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/gestor/colaboradores/${person.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {person.full_name}
                  </Link>
                  <p className="font-mono text-xs text-muted">
                    {person.username}
                    {!person.active && " · desativado"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={summary.completionPct} className="w-24" />
                    <span className="text-xs text-muted">{pctText(summary.completionPct)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {summary.lessonsDone}/{summary.lessonsTotal}
                </td>
                <td className="px-4 py-3">
                  {summary.avgScorePct === null ? "—" : pctText(summary.avgScorePct)}
                </td>
                <td className="px-4 py-3">
                  {summary.failedLessons > 0 ? (
                    <span className="badge bg-red-100 text-red-800">{summary.failedLessons}</span>
                  ) : (
                    <span className="text-muted">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{lastSeenText(person.last_seen_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
