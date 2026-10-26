"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemo, isSupabaseConfigured } from "@/lib/supabase/env";
import { homeFor } from "@/lib/auth";
import { DEMO_COOKIE } from "@/lib/demo/session";
import { demoStore } from "@/lib/demo/store";
import type { Role } from "@/lib/types";
import { normalizeUsername, usernameToEmail } from "@/lib/username";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Digite o usuário e a senha." };

  if (isDemo()) {
    const user = demoStore().users.find((u) => u.username === username && u.password === password);
    if (!user) return { error: "Usuário ou senha incorretos." };
    if (!user.active) return { error: "Este acesso está desativado. Fale com o gestor." };
    user.last_seen_at = new Date().toISOString();
    (await cookies()).set(DEMO_COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/" });
    redirect(homeFor(user.role));
  }

  if (!isSupabaseConfigured()) {
    return { error: "O sistema ainda não foi configurado. Avise o gestor." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  if (error || !data.user) return { error: "Usuário ou senha incorretos." };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, active")
    .eq("id", data.user.id)
    .maybeSingle<{ role: Role; active: boolean }>();

  if (!profile || !profile.active) {
    await supabase.auth.signOut();
    return { error: "Este acesso está desativado. Fale com o gestor." };
  }

  await admin
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", data.user.id);

  redirect(homeFor(profile.role));
}

export async function logout() {
  if (isDemo()) {
    (await cookies()).delete(DEMO_COOKIE);
  } else {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
