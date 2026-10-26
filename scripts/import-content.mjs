// Envia os módulos, aulas e perguntas da pasta content/ para o Supabase.
// Rode no seu computador, quantas vezes quiser (ele atualiza o que já existe):
//   npm run importar-conteudo
//
// Formato de cada arquivo content/*.json:
// {
//   "module": { "title": "Módulo 1", "position": 1 },
//   "lessons": [{
//     "position": 1, "title": "Aula 01", "youtube_id": "ID_DO_VIDEO", "duration_seconds": 102,
//     "questions": [ { "set": 1, "position": 1, "prompt": "...", "options": ["A","B","C","D"], "correct_index": 2 } ]
//   }]
// }
// Cada aula precisa de 9 perguntas: 3 conjuntos (set 1, 2 e 3) com 3 perguntas (position 1, 2 e 3).

import { createClient } from "@supabase/supabase-js";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no arquivo .env.local.");
  process.exit(1);
}

const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

function fail(message, error) {
  console.error(`${message}${error ? `: ${error.message}` : ""}`);
  process.exit(1);
}

function validateQuestions(lessonTitle, questions) {
  const seen = new Set();
  for (const q of questions) {
    const where = `${lessonTitle}, conjunto ${q.set}, pergunta ${q.position}`;
    if (![1, 2, 3].includes(q.set) || ![1, 2, 3].includes(q.position)) {
      fail(`Pergunta inválida (${where}): "set" e "position" devem ser 1, 2 ou 3.`);
    }
    if (!q.prompt || !Array.isArray(q.options) || q.options.length < 2) {
      fail(`Pergunta inválida (${where}): precisa de "prompt" e de pelo menos 2 "options".`);
    }
    if (!Number.isInteger(q.correct_index) || q.correct_index < 0 || q.correct_index >= q.options.length) {
      fail(`Pergunta inválida (${where}): "correct_index" fora das alternativas.`);
    }
    const key = `${q.set}-${q.position}`;
    if (seen.has(key)) fail(`Pergunta repetida (${where}).`);
    seen.add(key);
  }
  if (questions.length !== 9) {
    console.warn(`Atenção: "${lessonTitle}" tem ${questions.length} perguntas (o ideal são 9).`);
  }
}

const dir = "content";
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
if (files.length === 0) fail("Nenhum arquivo .json encontrado na pasta content/.");

for (const file of files) {
  const { module: mod, lessons } = JSON.parse(readFileSync(join(dir, file), "utf8"));
  console.log(`\n${file}: ${mod.title}`);

  const { data: existingModule } = await db
    .from("modules")
    .select("id")
    .eq("position", mod.position)
    .maybeSingle();

  let moduleId = existingModule?.id;
  if (moduleId) {
    const { error } = await db.from("modules").update({ title: mod.title }).eq("id", moduleId);
    if (error) fail("Erro ao atualizar o módulo", error);
  } else {
    const { data, error } = await db
      .from("modules")
      .insert({ title: mod.title, position: mod.position })
      .select("id")
      .single();
    if (error) fail("Erro ao criar o módulo (você já rodou o SQL em supabase/migrations?)", error);
    moduleId = data.id;
  }

  for (const lesson of lessons) {
    const row = {
      module_id: moduleId,
      title: lesson.title,
      youtube_id: lesson.youtube_id,
      duration_seconds: lesson.duration_seconds ?? 0,
      position: lesson.position,
    };

    const { data: existingLesson } = await db
      .from("lessons")
      .select("id")
      .eq("module_id", moduleId)
      .eq("position", lesson.position)
      .maybeSingle();

    let lessonId = existingLesson?.id;
    if (lessonId) {
      const { error } = await db.from("lessons").update(row).eq("id", lessonId);
      if (error) fail(`Erro ao atualizar ${lesson.title}`, error);
    } else {
      const { data, error } = await db.from("lessons").insert(row).select("id").single();
      if (error) fail(`Erro ao criar ${lesson.title}`, error);
      lessonId = data.id;
    }

    const questions = lesson.questions ?? [];
    if (questions.length > 0) {
      validateQuestions(lesson.title, questions);
      const { error: delError } = await db.from("questions").delete().eq("lesson_id", lessonId);
      if (delError) fail(`Erro ao limpar as perguntas de ${lesson.title}`, delError);
      const { error: insError } = await db.from("questions").insert(
        questions.map((q) => ({
          lesson_id: lessonId,
          question_set: q.set,
          position: q.position,
          prompt: q.prompt,
          options: q.options,
          correct_index: q.correct_index,
        })),
      );
      if (insError) fail(`Erro ao salvar as perguntas de ${lesson.title}`, insError);
    }

    console.log(`  ✓ ${lesson.title} (${questions.length} perguntas)`);
  }
}

console.log("\nPronto! Conteúdo enviado.");
