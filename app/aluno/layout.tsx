import AppHeader from "@/components/AppHeader";
import DemoBanner from "@/components/DemoBanner";
import { requireProfile } from "@/lib/auth";

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile("aluno");

  return (
    <>
      <DemoBanner />
      <AppHeader
        name={profile.full_name}
        roleLabel="Colaborador"
        homeHref="/aluno"
        items={[{ href: "/aluno", label: "Minhas aulas", exact: true }]}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
