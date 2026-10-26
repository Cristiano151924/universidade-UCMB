"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { MAX_ATTEMPTS, PASS_SCORE, QUESTIONS_PER_SET } from "@/lib/learning";
import { getRepo } from "@/lib/repo";
import { loadStudentViews } from "@/lib/student";
import type { PublicQuestion } from "@/lib/types";

export type StartQuizResult =
  | { ok: true; attemptNumber: number; questions: PublicQuestion[] }
  | { ok: false; error: string };

export type SubmitQuizResult =
  | {
      ok: true;
      score: number;
      total: number;
      passed: boolean;
      attemptNumber: number;
      attemptsLeft: number;
    }
  | { ok: false; error: string };

// Confere se este aluno pode fazer o quiz agora e qual conjunto de perguntas é a vez dele.
async function quizContext(userId: string, lessonId: string) {
  const views = await loadStudentViews(userId);
  const lesson = views.find((v) => v.id === lessonId);
  if (!lesson || !lesson.unlocked) return { error: "Aula não disponível." } as const;
  if (!lesson.quiz_ready) return { error: "As perguntas desta aula ainda estão em preparação." } as const;
  if (!lesson.videoDone) return { error: "Assista pelo menos 90% da aula para liberar o quiz." } as const;
  if (lesson.passedQuiz) return { error: "Você já foi aprovado neste quiz." } as const;
  if (lesson.attemptsUsed >= MAX_ATTEMPTS) return { error: "Você já usou as 3 tentativas." } as const;

  const attemptNumber = lesson.attemptsUsed + 1;
  const questions = await getRepo().getQuestions(lessonId, attemptNumber);
  if (questions.length !== QUESTIONS_PER_SET) {
    return { error: "As perguntas desta tentativa não estão disponíveis." } as const;
  }
  return { attemptNumber, questions } as const;
}

export async function startQuiz(lessonId: string): Promise<StartQuizResult> {
  const profile = await requireProfile("aluno");
  const ctx = await quizContext(profile.id, lessonId);
  if (ctx.error !== undefined) return { ok: false, error: ctx.error };

  return {
    ok: true,
    attemptNumber: ctx.attemptNumber,
    // A resposta certa nunca sai do servidor.
    questions: ctx.questions.map(({ id, prompt, options }) => ({ id, prompt, options })),
  };
}

export async function submitQuiz(lessonId: string, answers: number[]): Promise<SubmitQuizResult> {
  const profile = await requireProfile("aluno");
  const ctx = await quizContext(profile.id, lessonId);
  if (ctx.error !== undefined) return { ok: false, error: ctx.error };

  const { attemptNumber, questions } = ctx;
  if (
    !Array.isArray(answers) ||
    answers.length !== questions.length ||
    answers.some((a, i) => !Number.isInteger(a) || a < 0 || a >= questions[i].options.length)
  ) {
    return { ok: false, error: "Responda todas as perguntas." };
  }

  const score = questions.reduce((sum, q, i) => sum + (answers[i] === q.correct_index ? 1 : 0), 0);
  const passed = score >= PASS_SCORE;

  try {
    await getRepo().addAttempt({
      user_id: profile.id,
      lesson_id: lessonId,
      attempt_number: attemptNumber,
      question_set: attemptNumber,
      answers,
      score,
      total: questions.length,
      passed,
    });
  } catch {
    return { ok: false, error: "Não foi possível registrar a tentativa. Atualize a página." };
  }

  revalidatePath("/aluno", "layout");
  return {
    ok: true,
    score,
    total: questions.length,
    passed,
    attemptNumber,
    attemptsLeft: passed ? 0 : MAX_ATTEMPTS - attemptNumber,
  };
}
