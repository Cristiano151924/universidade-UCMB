import { createClient } from "@supabase/supabase-js";
import { supabaseSecretKey, supabaseUrl } from "./env";

// Cliente com poder total (ignora as regras de segurança do banco).
// Só use no servidor, SEMPRE depois de conferir quem está pedindo (requireProfile).
export function createAdminClient() {
  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
