"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

type DemoAccount = { label: string; username: string; password: string };

export default function LoginForm({ demoAccounts }: { demoAccounts?: DemoAccount[] }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <div className="space-y-4">
      <form action={action} className="card space-y-4">
        <div>
          <label htmlFor="username" className="label">
            Usuário
          </label>
          <input
            id="username"
            name="username"
            className="input"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            required
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            autoComplete="current-password"
            required
          />
        </div>

        {state.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {demoAccounts && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-medium text-amber-900">Modo demonstração</p>
          <p className="mt-1 text-amber-900/80">
            Dados fictícios só para testar o visual. Entre com um clique:
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {demoAccounts.map((account) => (
              <form key={account.username} action={action}>
                <input type="hidden" name="username" value={account.username} />
                <input type="hidden" name="password" value={account.password} />
                <button type="submit" className="btn w-full" disabled={pending}>
                  {account.label}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
