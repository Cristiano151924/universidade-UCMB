// Banco FICTÍCIO do modo demonstração: tudo fica na memória do servidor
// e volta ao início quando o site é reiniciado. Serve só para ver o visual.

import content from "@/content/modulo-inicial.json";
import type { Attempt, Lesson, Module, Profile, Progress, Question } from "@/lib/types";

export type DemoUser = Profile & { password: string };

export type DemoStore = {
  users: DemoUser[];
  modules: Module[];
  lessons: Lesson[];
  questions: Question[];
  progress: Progress[];
  attempts: Attempt[];
};

export const DEMO_PASSWORD = "demo1234";
export const DEMO_GESTOR = "gestor";
export const DEMO_ALUNO = "aluno.demo";

const globalForDemo = globalThis as unknown as { __ucmbDemo?: DemoStore };

export function demoStore(): DemoStore {
  if (!globalForDemo.__ucmbDemo) globalForDemo.__ucmbDemo = seed();
  return globalForDemo.__ucmbDemo;
}

const LETTERS = ["A", "B", "C", "D"];

function ago(days: number, hours = 0): string {
  return new Date(Date.now() - days * 86_400_000 - hours * 3_600_000).toISOString();
}

function seed(): DemoStore {
  const moduleId = "demo-module-1";
  const modules: Module[] = [
    { id: moduleId, title: content.module.title, position: content.module.position },
  ];

  const lessons: Lesson[] = content.lessons.map((l) => ({
    id: `demo-lesson-${l.position}`,
    module_id: moduleId,
    title: l.title,
    youtube_id: l.youtube_id,
    duration_seconds: l.duration_seconds,
    position: l.position,
    quiz_ready: true,
  }));

  // Perguntas de EXEMPLO (as reais serão criadas a partir da transcrição de cada vídeo).
  const questions: Question[] = [];
  for (const lesson of lessons) {
    for (let set = 1; set <= 3; set++) {
      for (let position = 1; position <= 3; position++) {
        const correct = (set + position) % 4;
        questions.push({
          id: `demo-q-${lesson.position}-${set}-${position}`,
          lesson_id: lesson.id,
          question_set: set,
          position,
          prompt: `[Exemplo] Pergunta ${position} da tentativa ${set}. Dica da demonstração: a correta é a letra ${LETTERS[correct]}.`,
          options: LETTERS.map((letter) => `Alternativa ${letter}`),
          correct_index: correct,
        });
      }
    }
  }

  const user = (
    id: string,
    username: string,
    full_name: string,
    role: Profile["role"],
    created: number,
    lastSeen: string | null,
    active = true,
  ): DemoUser => ({
    id,
    username,
    full_name,
    role,
    active,
    created_at: ago(created),
    last_seen_at: lastSeen,
    password: DEMO_PASSWORD,
  });

  const users: DemoUser[] = [
    user("demo-gestor", DEMO_GESTOR, "Gestor Demonstração", "gestor", 30, ago(0)),
    user("demo-aluno", DEMO_ALUNO, "Aluno Demonstração", "aluno", 2, null),
    user("demo-maria", "maria.souza", "Maria Souza", "aluno", 20, ago(0, 3)),
    user("demo-joao", "joao.lima", "João Lima", "aluno", 18, ago(1)),
    user("demo-ana", "ana.paula", "Ana Paula Ribeiro", "aluno", 10, null),
    user("demo-carlos", "carlos.mendes", "Carlos Mendes", "aluno", 15, ago(9)),
    user("demo-fernanda", "fernanda.alves", "Fernanda Alves", "aluno", 12, ago(2)),
    user("demo-pedro", "pedro.santos", "Pedro Santos", "aluno", 25, ago(40), false),
  ];

  const lesson = lessons[0];
  const duration = lesson.duration_seconds;

  const progressFor = (
    userId: string,
    watched: number,
    completedAgo: number | null,
  ): Progress => ({
    user_id: userId,
    lesson_id: lesson.id,
    ranges: [[0, watched]],
    watched_seconds: watched,
    last_position: watched,
    completed_at: completedAgo === null ? null : ago(completedAgo),
    updated_at: ago(completedAgo ?? 1),
  });

  const progress: Progress[] = [
    progressFor("demo-maria", duration, 0),
    progressFor("demo-joao", Math.round(duration * 0.45), null),
    progressFor("demo-carlos", duration, 9),
    progressFor("demo-fernanda", Math.round(duration * 0.95), 2),
    progressFor("demo-pedro", duration, 40),
  ];

  let n = 0;
  const attempt = (
    userId: string,
    attempt_number: number,
    score: number,
    daysAgo: number,
  ): Attempt => ({
    id: `demo-att-${++n}`,
    user_id: userId,
    lesson_id: lesson.id,
    attempt_number,
    question_set: attempt_number,
    answers: [0, 0, 0],
    score,
    total: 3,
    passed: score >= 2,
    created_at: ago(daysAgo),
  });

  const attempts: Attempt[] = [
    attempt("demo-maria", 1, 3, 0),
    attempt("demo-carlos", 1, 1, 9),
    attempt("demo-carlos", 2, 1, 9),
    attempt("demo-carlos", 3, 0, 9),
    attempt("demo-fernanda", 1, 1, 2),
    attempt("demo-pedro", 1, 2, 40),
  ];

  return { users, modules, lessons, questions, progress, attempts };
}
