export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublicKey && supabaseSecretKey);
}

// Modo demonstração: dados fictícios na memória, só para ver o visual.
// Só liga em desenvolvimento (npm run dev) e nunca junto com um Supabase configurado.
export function isDemo(): boolean {
  return (
    process.env.DEMO_MODE === "true" &&
    process.env.NODE_ENV !== "production" &&
    !isSupabaseConfigured()
  );
}
