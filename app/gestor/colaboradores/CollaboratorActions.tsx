"use client";

import { useState, useTransition } from "react";
import {
  resetCollaboratorPassword,
  setCollaboratorActive,
  type Credentials,
} from "@/app/actions/collaborators";
import CredentialsCard from "@/components/CredentialsCard";

export default function CollaboratorActions({
  userId,
  fullName,
  active,
}: {
  userId: string;
  fullName: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    if (!window.confirm(`Gerar uma nova senha para ${fullName}? A senha atual deixa de valer.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await resetCollaboratorPassword(userId);
      if (result.error) setError(result.error);
      else setCredentials(result.credentials ?? null);
    });
  }

  function toggle() {
    const question = active
      ? `Desativar o acesso de ${fullName}? Ele não conseguirá mais entrar (o histórico é mantido).`
      : `Reativar o acesso de ${fullName}?`;
    if (!window.confirm(question)) return;
    setError(null);
    startTransition(async () => {
      const result = await setCollaboratorActive(userId, !active);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className="btn" onClick={reset} disabled={pending || !active}>
          Nova senha
        </button>
        <button
          type="button"
          className={active ? "btn btn-danger" : "btn"}
          onClick={toggle}
          disabled={pending}
        >
          {active ? "Desativar" : "Reativar"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-right text-xs text-red-700">
          {error}
        </p>
      )}
      {credentials && (
        <div className="text-left">
          <CredentialsCard
            credentials={credentials}
            title="Nova senha gerada"
            onClose={() => setCredentials(null)}
          />
        </div>
      )}
    </div>
  );
}
