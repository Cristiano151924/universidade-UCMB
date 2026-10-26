import AppHeader from "@/components/AppHeader";
import DemoBanner from "@/components/DemoBanner";
import { requireProfile } from "@/lib/auth";

export default async function GestorLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile("gestor");

  return (
    <>
      <DemoBanner />
      <AppHeader
        name={profile.full_name}
        roleLabel="Gestor"
        homeHref="/gestor"
        items={[
          { href: "/gestor", label: "Painel", exact: true },
          { href: "/gestor/colaboradores", label: "Colaboradores" },
          { href: "/gestor/materiais", label: "Materiais" },
        ]}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
