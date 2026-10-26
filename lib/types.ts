export type Role = "aluno" | "gestor";

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  role: Role;
  active: boolean;
  created_at: string;
  last_seen_at: string | null;
};

export type Module = { id: string; title: string; position: number };

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  youtube_id: string;
  duration_seconds: number;
  position: number;
  // true quando existem os 3 conjuntos de 3 perguntas
  quiz_ready: boolean;
};

export type Catalog = { modules: Module[]; lessons: Lesson[] };

export type Range = [number, number];

export type Progress = {
  user_id: string;
  lesson_id: string;
  ranges: Range[];
  watched_seconds: number;
  last_position: number;
  completed_at: string | null;
  updated_at: string;
};

export type Attempt = {
  id: string;
  user_id: string;
  lesson_id: string;
  attempt_number: number;
  question_set: number;
  answers: number[];
  score: number;
  total: number;
  passed: boolean;
  created_at: string;
};

export type NewAttempt = Omit<Attempt, "id" | "created_at">;

// Com a resposta certa: só existe no servidor.
export type Question = {
  id: string;
  lesson_id: string;
  question_set: number;
  position: number;
  prompt: string;
  options: string[];
  correct_index: number;
};

// O que o aluno recebe (sem a resposta certa).
export type PublicQuestion = Pick<Question, "id" | "prompt" | "options">;
