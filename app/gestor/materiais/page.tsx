import { requireProfile } from "@/lib/auth";

export default async function MateriaisPage() {
  await requireProfile("gestor");

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Materiais de apoio</h1>
      <p className="text-sm text-muted">
        Aqui você vai enviar os PDFs de cada aula. Esta tela será construída em uma etapa futura.
      </p>
    </div>
  );
}
