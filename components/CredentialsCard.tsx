"use client";

import { useState } from "react";
import type { Credentials } from "@/app/actions/collaborators";

// Mostra o usuário e a senha UMA vez, com botão para copiar a mensagem pronta.
export default function CredentialsCard({
  credentials,
  title,
  onClose,
}: {
  credentials: Credentials;
  title: string;
  onClose?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const message =
    `Olá, ${credentials.fullName.split(" ")[0]}! Seu acesso à Universidade UCMB:\n` +
    `Endereço: ${typeof window !== "undefined" ? window.location.origin : ""}\n` +
    `Usuário: ${credentials.username}\n` +
    `Senha: ${credentials.password}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
      <p className="font-medium text-emerald-900">{title}</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-emerald-800">Nome</dt>
        <dd className="font-medium">{credentials.fullName}</dd>
        <dt className="text-emerald-800">Usuário</dt>
        <dd className="font-mono font-medium">{credentials.username}</dd>
        <dt className="text-emerald-800">Senha</dt>
        <dd className="font-mono font-medium">{credentials.password}</dd>
      </dl>
      <p className="mt-3 text-emerald-900">
        Anote ou copie agora: por segurança, a senha <strong>não aparece de novo</strong>. Se
        perder, use &ldquo;Nova senha&rdquo;.
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={copy} className="btn btn-primary">
          {copied ? "Copiado!" : "Copiar mensagem pronta"}
        </button>
        {onClose && (
          <button type="button" onClick={onClose} className="btn">
            Fechar
          </button>
        )}
      </div>
    </div>
  );
}
