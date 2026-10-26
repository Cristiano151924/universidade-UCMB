"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { demoStore } from "@/lib/demo/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemo } from "@/lib/supabase/env";
import {
  generatePassword,
  normalizeUsername,
  USERNAME_PATTERN,
  usernameToEmail,
} from "@/lib/username";

export type Credentials = { fullName: string; username: string; password: string };

export type CreateState = { error?: string; credentials?: Credentials };
export type ResetState = { error?: string; credentials?: Credentials };

const LIST_PATH = "/gestor/colaboradores";

export async function createCollaborator(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  await requireProfile("gestor");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const username = normalizeUsername(String(formData.get("username") ?? ""));

  if (fullName.length < 2) return { error: "Digite o nome completo." };
  if (!USERNAME_PATTERN.test(username)) {
    return {
      error:
        "Usuário inválido. Use de 3 a 30 caracteres: letras minúsculas, números, ponto, hífen ou _ (sem espaços e sem acentos).",
    };
  }

  const password = generatePassword();

  if (isDemo()) {
    const store = demoStore();
    if (store.users.some((u) => u.username === username)) {
      return { error: `O usuário "${username}" já existe. Escolha outro.` };
    }
    store.users.push({
      id: `demo-${username}-${Date.now()}`,
      username,
      full_name: fullName,
      role: "aluno",
      active: true,
      created_at: new Date().toISOString(),
      last_seen_at: null,
      password,
    });
    revalidatePath(LIST_PATH);
    return { credentials: { fullName, username, password } };
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) return { error: `O usuário "${username}" já existe. Escolha outro.` };

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return { error: "Não foi possível criar o acesso. Tente novamente." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    username,
    full_name: fullName,
    role: "aluno",
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "Não foi possível salvar o colaborador. Tente novamente." };
  }

  revalidatePath(LIST_PATH);
  return { credentials: { fullName, username, password } };
}

// Garante que o alvo existe e é um colaborador (o gestor nunca é alterado por aqui).
async function findCollaborator(userId: string) {
  if (isDemo()) {
    const user = demoStore().users.find((u) => u.id === userId && u.role === "aluno");
    return user ? { id: user.id, username: user.username, full_name: user.full_name } : null;
  }
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id, username, full_name, role")
    .eq("id", userId)
    .eq("role", "aluno")
    .maybeSingle<{ id: string; username: string; full_name: string; role: "aluno" }>();
  return data;
}

export async function resetCollaboratorPassword(userId: string): Promise<ResetState> {
  await requireProfile("gestor");

  const target = await findCollaborator(userId);
  if (!target) return { error: "Colaborador não encontrado." };

  const password = generatePassword();

  if (isDemo()) {
    const user = demoStore().users.find((u) => u.id === target.id);
    if (user) user.password = password;
  } else {
    const { error } = await createAdminClient().auth.admin.updateUserById(target.id, { password });
    if (error) return { error: "Não foi possível redefinir a senha. Tente novamente." };
  }

  return {
    credentials: { fullName: target.full_name, username: target.username, password },
  };
}

export async function setCollaboratorActive(
  userId: string,
  active: boolean,
): Promise<{ error?: string }> {
  await requireProfile("gestor");

  const target = await findCollaborator(userId);
  if (!target) return { error: "Colaborador não encontrado." };

  if (isDemo()) {
    const user = demoStore().users.find((u) => u.id === target.id);
    if (user) user.active = active;
    revalidatePath(LIST_PATH);
    return {};
  }

  const admin = createAdminClient();

  // "ban" impede novos logins; o login atual também deixa de valer porque o
  // site confere profiles.active em toda página.
  const { error: authError } = await admin.auth.admin.updateUserById(target.id, {
    ban_duration: active ? "none" : "876000h",
  });
  if (authError) return { error: "Não foi possível alterar o acesso. Tente novamente." };

  const { error } = await admin.from("profiles").update({ active }).eq("id", target.id);
  if (error) return { error: "Não foi possível salvar a alteração. Tente novamente." };

  revalidatePath(LIST_PATH);
  return {};
}
