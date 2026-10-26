import { createAdminClient } from "@/lib/supabase/admin";
import { QUESTIONS_PER_SET } from "@/lib/learning";
import type { Attempt, Lesson, Module, Profile, Progress, Question } from "@/lib/types";
import type { Repo } from "./types";

function fail(what: string, message: string): never {
  throw new Error(`Falha ao ${what}: ${message}`);
}

type LessonRow = Omit<Lesson, "quiz_ready">;

export const supabaseRepo: Repo = {
  async listCollaborators() {
    const { data, error } = await createAdminClient()
      .from("profiles")
      .select("*")
      .eq("role", "aluno")
      .order("full_name")
      .returns<Profile[]>();
    if (error) fail("listar colaboradores", error.message);
    return data ?? [];
  },

  async getCollaborator(id) {
    const { data, error } = await createAdminClient()
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("role", "aluno")
      .maybeSingle<Profile>();
    if (error) fail("buscar colaborador", error.message);
    return data;
  },

  async getCatalog() {
    const db = createAdminClient();
    const [modules, lessons, questions] = await Promise.all([
      db.from("modules").select("*").order("position").returns<Module[]>(),
      db.from("lessons").select("*").order("position").returns<LessonRow[]>(),
      db
        .from("questions")
        .select("lesson_id, question_set")
        .returns<{ lesson_id: string; question_set: number }[]>(),
    ]);
    if (modules.error) fail("ler módulos", modules.error.message);
    if (lessons.error) fail("ler aulas", lessons.error.message);
    if (questions.error) fail("ler perguntas", questions.error.message);

    const counts = new Map<string, number>();
    for (const q of questions.data ?? []) {
      const key = `${q.lesson_id}:${q.question_set}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return {
      modules: modules.data ?? [],
      lessons: (lessons.data ?? []).map((l) => ({
        ...l,
        quiz_ready: [1, 2, 3].every((set) => counts.get(`${l.id}:${set}`) === QUESTIONS_PER_SET),
      })),
    };
  },

  async getProgress(userId) {
    let query = createAdminClient().from("watch_progress").select("*");
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query.returns<Progress[]>();
    if (error) fail("ler progresso", error.message);
    return data ?? [];
  },

  async saveProgress(progress) {
    const { error } = await createAdminClient()
      .from("watch_progress")
      .upsert(progress, { onConflict: "user_id,lesson_id" });
    if (error) fail("salvar progresso", error.message);
  },

  async getAttempts(userId) {
    let query = createAdminClient().from("quiz_attempts").select("*");
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query.returns<Attempt[]>();
    if (error) fail("ler tentativas", error.message);
    return data ?? [];
  },

  async addAttempt(attempt) {
    const { error } = await createAdminClient().from("quiz_attempts").insert(attempt);
    if (error) fail("registrar tentativa", error.message);
  },

  async getQuestions(lessonId, questionSet) {
    const { data, error } = await createAdminClient()
      .from("questions")
      .select("*")
      .eq("lesson_id", lessonId)
      .eq("question_set", questionSet)
      .order("position")
      .returns<Question[]>();
    if (error) fail("ler perguntas", error.message);
    return data ?? [];
  },
};
