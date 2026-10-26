import { buildLessonViews, type LessonView } from "./learning";
import { getRepo } from "./repo";

// Carrega e calcula a situação de todas as aulas de UMA pessoa.
export async function loadStudentViews(userId: string): Promise<LessonView[]> {
  const repo = getRepo();
  const [catalog, progress, attempts] = await Promise.all([
    repo.getCatalog(),
    repo.getProgress(userId),
    repo.getAttempts(userId),
  ]);
  return buildLessonViews(catalog, progress, attempts);
}
