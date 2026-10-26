// Cria (ou atualiza) o PRIMEIRO usuário gestor. Rode uma vez, no seu computador:
//   npm run criar-gestor
// Ele pergunta o usuário, o nome e a senha. Nada disso fica salvo em arquivo.

import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const domain = process.env.LOGIN_DOMAIN ?? "ucmb.local";

if (!url || !secret) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no arquivo .env.local. Preencha e tente de novo.",
  );
  process.exit(1);
}

const rl = createInterface({ input, output });
const username = (await rl.question("Usuário do gestor (ex.: gustavo): ")).trim().toLowerCase();
const fullName = (await rl.question("Nome completo: ")).trim();
const password = await rl.question("Senha (mínimo 8 caracteres): ");
rl.close();

if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
  console.error("Usuário inválido: use 3 a 30 caracteres (letras minúsculas, números, . - _).");
  process.exit(1);
}
if (fullName.length < 2) {
  console.error("Digite o nome completo.");
  process.exit(1);
}
if (password.length < 8) {
  console.error("A senha precisa ter pelo menos 8 caracteres.");
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const email = `${username}@${domain}`;
let userId;

const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (createError) {
  // Já existe? Então só atualiza a senha e promove a gestor.
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users.find((u) => u.email === email);
  if (!existing) {
    console.error("Não foi possível criar o usuário:", createError.message);
    process.exit(1);
  }
  userId = existing.id;
  await admin.auth.admin.updateUserById(userId, { password });
} else {
  userId = created.user.id;
}

const { error: profileError } = await admin.from("profiles").upsert({
  id: userId,
  username,
  full_name: fullName,
  role: "gestor",
  active: true,
});

if (profileError) {
  console.error(
    "O login foi criado, mas não consegui salvar o perfil. Você já rodou o arquivo supabase/migrations/0001_init.sql no SQL Editor?",
    profileError.message,
  );
  process.exit(1);
}

console.log(`Pronto! Gestor "${username}" criado. Agora entre em /login com esse usuário e senha.`);
