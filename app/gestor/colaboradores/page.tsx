import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { getRepo } from "@/lib/repo";
import CollaboratorActions from "./CollaboratorActions";
import NewCollaboratorForm from "./NewCollaboratorForm";

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function ColaboradoresPage() {
  await requireProfile("gestor");
  const rows = await getRepo().listCollaborators();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Colaboradores</h1>
        <p className="mt-1 text-sm text-muted">
          Crie o acesso de cada colaborador e passe o usuário e a senha para ele.
        </p>
      </div>

      <NewCollaboratorForm />

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              <th className="px-4 py-3 font-medium">Último acesso</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Nenhum colaborador cadastrado ainda.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line align-top last:border-0">
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/gestor/colaboradores/${row.id}`}
                    className="text-brand hover:underline"
                  >
                    {row.full_name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{row.username}</td>
                <td className="px-4 py-3">
                  {row.active ? (
                    <span className="badge bg-emerald-50 text-emerald-700">Ativo</span>
                  ) : (
                    <span className="badge bg-zinc-100 text-zinc-600">Desativado</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">
                  {row.last_seen_at ? dateFormat.format(new Date(row.last_seen_at)) : "Nunca entrou"}
                </td>
                <td className="px-4 py-3">
                  <CollaboratorActions
                    userId={row.id}
                    fullName={row.full_name}
                    active={row.active}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
