import { connection } from "next/server";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import { getCurrentProfile, homeFor } from "@/lib/auth";
import { DEMO_ALUNO, DEMO_GESTOR, DEMO_PASSWORD } from "@/lib/demo/store";
import { isDemo, isSupabaseConfigured } from "@/lib/supabase/env";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  await connection(); // sempre decide na hora, nunca pré-gerada
  const demo = isDemo();
  const configured = isSupabaseConfigured() || demo;

  if (configured) {
    const profile = await getCurrentProfile();
    if (profile) redirect(homeFor(profile.role));
  }

  return (
    <main className="flex flex-1 flex-col bg-band">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-4 flex justify-center">
            <Logo className="h-auto w-full max-w-xs" />
          </div>
          <p className="mb-5 text-center text-sm font-medium text-slate-800">
            Entre com o usuário e a senha que você recebeu.
          </p>

          {configured ? (
            <LoginForm
              demoAccounts={
                demo
                  ? [
                      { label: "Entrar como Gestor", username: DEMO_GESTOR, password: DEMO_PASSWORD },
                      { label: "Entrar como Colaborador", username: DEMO_ALUNO, password: DEMO_PASSWORD },
                    ]
                  : undefined
              }
            />
          ) : (
            <div className="card text-sm">
              <p className="font-medium">Configuração pendente</p>
              <p className="mt-1 text-muted">
                Falta conectar o banco de dados (Supabase). Preencha o arquivo{" "}
                <code>.env.local</code> e reinicie o site.
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="h-1 bg-brand" />
    </main>
  );
}
