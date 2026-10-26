import { demoStore } from "@/lib/demo/store";
import type { Profile } from "@/lib/types";
import type { Repo } from "./types";

function publicProfile(user: Profile & { password?: string }): Profile {
  // Nunca devolve a senha de demonstração.
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    active: user.active,
    created_at: user.created_at,
    last_seen_at: user.last_seen_at,
  };
}

export const demoRepo: Repo = {
  async listCollaborators() {
    return demoStore()
      .users.filter((u) => u.role === "aluno")
      .map(publicProfile)
      .sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR"));
  },

  async getCollaborator(id) {
    const user = demoStore().users.find((u) => u.id === id && u.role === "aluno");
    return user ? publicProfile(user) : null;
  },

  async getCatalog() {
    const { modules, lessons } = demoStore();
    return { modules: structuredClone(modules), lessons: structuredClone(lessons) };
  },

  async getProgress(userId) {
    const rows = demoStore().progress.filter((p) => !userId || p.user_id === userId);
    return structuredClone(rows);
  },

  async saveProgress(progress) {
    const store = demoStore();
    const index = store.progress.findIndex(
      (p) => p.user_id === progress.user_id && p.lesson_id === progress.lesson_id,
    );
    if (index >= 0) store.progress[index] = structuredClone(progress);
    else store.progress.push(structuredClone(progress));
  },

  async getAttempts(userId) {
    const rows = demoStore().attempts.filter((a) => !userId || a.user_id === userId);
    return structuredClone(rows);
  },

  async addAttempt(attempt) {
    const store = demoStore();
    const duplicate = store.attempts.some(
      (a) =>
        a.user_id === attempt.user_id &&
        a.lesson_id === attempt.lesson_id &&
        a.attempt_number === attempt.attempt_number,
    );
    if (duplicate) throw new Error("Tentativa já registrada.");
    store.attempts.push({
      ...structuredClone(attempt),
      id: `demo-att-${store.attempts.length + 1}-${Date.now()}`,
      created_at: new Date().toISOString(),
    });
  },

  async getQuestions(lessonId, questionSet) {
    const rows = demoStore()
      .questions.filter((q) => q.lesson_id === lessonId && q.question_set === questionSet)
      .sort((a, b) => a.position - b.position);
    return structuredClone(rows);
  },
};
