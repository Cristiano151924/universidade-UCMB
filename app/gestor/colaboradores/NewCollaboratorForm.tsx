"use client";

import { useActionState, useState } from "react";
import { createCollaborator, type CreateState } from "@/app/actions/collaborators";
import CredentialsCard from "@/components/CredentialsCard";

// Sugere um usuário a partir do nome: "João da Silva" -> "joao.silva"
function suggestUsername(fullName: string): string {
  const parts = fullName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((p) => p && !["da", "de", "do", "das", "dos", "e"].includes(p));
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts[parts.length - 1]}`;
}

// Campos controlados: se der erro, o que foi digitado continua na tela.
// Quando dá certo, o "key" muda, os campos são recriados e ficam vazios.
function Fields({ pending }: { pending: boolean }) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameEdited, setUsernameEdited] = useState(false);

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div>
        <label htmlFor="full_name" className="label">
          Nome completo
        </label>
        <input
          id="full_name"
          name="full_name"
          className="input"
          required
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (!usernameEdited) setUsername(suggestUsername(e.target.value));
          }}
        />
      </div>
      <div>
        <label htmlFor="username" className="label">
          Usuário (para entrar)
        </label>
        <input
          id="username"
          name="username"
          className="input"
          required
          autoCapitalize="none"
          autoCorrect="off"
          value={username}
          onChange={(e) => {
            setUsernameEdited(true);
            setUsername(e.target.value);
          }}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Criando..." : "Criar acesso"}
      </button>
    </div>
  );
}

export default function NewCollaboratorForm() {
  const [state, action, pending] = useActionState<CreateState, FormData>(createCollaborator, {});
  const [dismissed, setDismissed] = useState<object | null>(null);

  const showCredentials = state.credentials && dismissed !== state.credentials;

  return (
    <div className="space-y-4">
      <form action={action} className="card">
        <h2 className="font-medium">Novo colaborador</h2>
        <Fields key={state.credentials?.password ?? "novo"} pending={pending} />
        <p className="mt-2 text-xs text-muted">
          A senha é gerada automaticamente e aparece uma única vez, depois de criar.
        </p>
        {state.error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
      </form>

      {showCredentials && state.credentials && (
        <CredentialsCard
          credentials={state.credentials}
          title="Acesso criado com sucesso"
          onClose={() => setDismissed(state.credentials!)}
        />
      )}
    </div>
  );
}
