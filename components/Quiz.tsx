"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startQuiz, submitQuiz, type SubmitQuizResult } from "@/app/actions/quiz";
import { MAX_ATTEMPTS, PASS_SCORE, QUESTIONS_PER_SET, WATCH_THRESHOLD } from "@/lib/learning";
import type { PublicQuestion } from "@/lib/types";
import { CheckIcon, LockIcon } from "./ui";

export type AttemptSummary = { number: number; score: number; total: number; passed: boolean };

type Props = {
  lessonId: string;
  quizReady: boolean;
  videoDone: boolean;
  watchedPct: number; // 0 a 1
  attempts: AttemptSummary[];
  passedQuiz: boolean;
  exhausted: boolean;
};

type Session = { attemptNumber: number; questions: PublicQuestion[]; answers: (number | null)[] };

const LETTERS = ["A", "B", "C", "D", "E"];

export default function Quiz({
  lessonId,
  quizReady,
  videoDone,
  watchedPct,
  attempts,
  passedQuiz,
  exhausted,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [session, setSession] = useState<Session | null>(null);
  const [result, setResult] = useState<Extract<SubmitQuizResult, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts.length);

  function begin() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const response = await startQuiz(lessonId);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setSession({
        attemptNumber: response.attemptNumber,
        questions: response.questions,
        answers: response.questions.map(() => null),
      });
    });
  }

  function send() {
    if (!session || session.answers.some((a) => a === null)) {
      setError("Responda todas as perguntas antes de enviar.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const response = await submitQuiz(lessonId, session.answers as number[]);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setSession(null);
      setResult(response);
      router.refresh();
    });
  }

  const header = (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">Quiz da aula</h2>
      <span className="text-xs text-muted">
        {QUESTIONS_PER_SET} perguntas · aprovação com {PASS_SCORE} acertos · até {MAX_ATTEMPTS} tentativas
      </span>
    </div>
  );

  // Resultado da tentativa que acabou de ser enviada
  if (result) {
    return (
      <div className="card space-y-4">
        {header}
        <div
          className={`rounded-xl p-4 ${result.passed ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}
        >
          <p className="text-2xl font-semibold">
            {result.score} de {result.total} acertos
          </p>
          <p className="mt-1 text-sm">
            {result.passed
              ? "Parabéns, você foi aprovado nesta aula!"
              : result.attemptsLeft > 0
                ? `Você não atingiu ${PASS_SCORE} acertos. Restam ${result.attemptsLeft} tentativa(s), com perguntas diferentes.`
                : "Você usou as 3 tentativas. A próxima aula foi liberada e o gestor foi informado da sua nota."}
          </p>
        </div>
        {!result.passed && result.attemptsLeft > 0 && (
          <button type="button" className="btn btn-primary" onClick={begin} disabled={pending}>
            {pending ? "Carregando..." : "Fazer a próxima tentativa"}
          </button>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  // Respondendo
  if (session) {
    return (
      <div className="card space-y-5">
        {header}
        <p className="text-sm font-medium text-brand-dark">
          Tentativa {session.attemptNumber} de {MAX_ATTEMPTS}
        </p>
        {session.questions.map((question, qi) => (
          <fieldset key={question.id} className="space-y-2">
            <legend className="font-medium">
              {qi + 1}. {question.prompt}
            </legend>
            <div className="space-y-2">
              {question.options.map((option, oi) => {
                const selected = session.answers[qi] === oi;
                return (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                      selected ? "border-brand bg-brand-soft" : "border-line hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      className="mt-0.5 accent-[var(--brand)]"
                      checked={selected}
                      onChange={() =>
                        setSession({
                          ...session,
                          answers: session.answers.map((a, i) => (i === qi ? oi : a)),
                        })
                      }
                    />
                    <span>
                      <strong className="mr-1">{LETTERS[oi]})</strong>
                      {option}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button type="button" className="btn btn-primary" onClick={send} disabled={pending}>
          {pending ? "Enviando..." : "Enviar respostas"}
        </button>
      </div>
    );
  }

  // Estados fixos
  let body: React.ReactNode;

  if (!quizReady) {
    body = (
      <p className="text-sm text-muted">
        As perguntas desta aula ainda estão sendo preparadas. Quando estiverem prontas, o quiz
        aparece aqui.
      </p>
    );
  } else if (!videoDone) {
    const missing = Math.max(0, Math.ceil((WATCH_THRESHOLD - watchedPct) * 100));
    body = (
      <div className="flex items-start gap-3 text-sm text-muted">
        <LockIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          O quiz libera quando você assistir pelo menos {WATCH_THRESHOLD * 100}% da aula. Faltam
          cerca de <strong className="text-foreground">{missing}%</strong>.
        </p>
      </div>
    );
  } else if (passedQuiz) {
    body = (
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-900">
        <CheckIcon className="h-6 w-6 shrink-0" />
        <p className="text-sm font-medium">Você foi aprovado neste quiz. Aula concluída!</p>
      </div>
    );
  } else if (exhausted) {
    body = (
      <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        Você usou as 3 tentativas deste quiz. A próxima aula está liberada e o gestor acompanha a sua
        nota.
      </p>
    );
  } else {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-muted">
          Você assistiu a aula. Agora responda {QUESTIONS_PER_SET} perguntas rápidas. Restam{" "}
          <strong className="text-foreground">{attemptsLeft}</strong> tentativa(s).
        </p>
        <button type="button" className="btn btn-primary" onClick={begin} disabled={pending}>
          {pending ? "Carregando..." : attempts.length === 0 ? "Começar o quiz" : "Fazer nova tentativa"}
        </button>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      {header}
      {body}
      {attempts.length > 0 && (
        <div className="border-t border-line pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Suas tentativas</p>
          <ul className="flex flex-wrap gap-2 text-sm">
            {attempts.map((a) => (
              <li
                key={a.number}
                className={`rounded-lg px-3 py-1 ${a.passed ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-700"}`}
              >
                {a.number}ª: {a.score}/{a.total}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
