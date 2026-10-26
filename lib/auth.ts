import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemo } from "@/lib/supabase/env";
import { getDemoProfile } from "@/lib/demo/session";
import type { Profile, Role } from "@/lib/types";

export type { Profile, Role };

export function homeFor(role: Role): string {
  return role === "gestor" ? "/gestor" : "/aluno";
}

// Quem está logado agora (ou null). Só devolve pessoas ativas.
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  if (isDemo()) return getDemoProfile();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await createAdminClient()
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (!data || !data.active) return null;
  return data;
});

// Use no começo de toda página e de toda ação protegida.
// Sem login -> /login. Papel errado -> manda para a área certa da pessoa.
export async function requireProfile(role?: Role): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (role && profile.role !== role) redirect(homeFor(profile.role));
  return profile;
}
