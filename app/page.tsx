import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentProfile, homeFor } from "@/lib/auth";
import { isDemo, isSupabaseConfigured } from "@/lib/supabase/env";

export default async function Home() {
  await connection(); // sempre decide na hora, nunca pré-gerada
  if (!isSupabaseConfigured() && !isDemo()) redirect("/login");
  const profile = await getCurrentProfile();
  redirect(profile ? homeFor(profile.role) : "/login");
}
