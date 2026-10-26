import type {
  Attempt,
  Catalog,
  NewAttempt,
  Profile,
  Progress,
  Question,
} from "@/lib/types";

// Só guarda e lê dados. As regras (liberar aula, nota, 90%) ficam em lib/learning.ts.
// Duas versões: Supabase (de verdade) e demo (fictícia, na memória).
export interface Repo {
  listCollaborators(): Promise<Profile[]>;
  getCollaborator(id: string): Promise<Profile | null>;
  getCatalog(): Promise<Catalog>;
  /** Sem userId = de todos os colaboradores. */
  getProgress(userId?: string): Promise<Progress[]>;
  saveProgress(progress: Progress): Promise<void>;
  /** Sem userId = de todos os colaboradores. */
  getAttempts(userId?: string): Promise<Attempt[]>;
  addAttempt(attempt: NewAttempt): Promise<void>;
  getQuestions(lessonId: string, questionSet: number): Promise<Question[]>;
}
