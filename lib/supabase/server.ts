import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublicKey, supabaseUrl } from "./env";

// Cliente que age "como o usuário logado" (lê o login pelos cookies).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Em páginas (Server Components) não dá para gravar cookies.
          // Tudo bem: o proxy.ts renova o login a cada visita.
        }
      },
    },
  });
}
