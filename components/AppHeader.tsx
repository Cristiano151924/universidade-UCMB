import Link from "next/link";
import { logout } from "@/app/actions/auth";
import Logo from "./Logo";
import NavLinks, { type NavItem } from "./NavLinks";

export default function AppHeader({
  name,
  roleLabel,
  items,
  homeHref,
}: {
  name: string;
  roleLabel: string;
  items: NavItem[];
  homeHref: string;
}) {
  return (
    <header className="bg-band">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-1">
        <Link href={homeHref} aria-label="Início">
          <Logo className="h-14 w-auto" />
        </Link>

        <NavLinks items={items} />

        <form action={logout} className="flex items-center gap-3 text-sm">
          <span className="hidden text-right leading-tight sm:block">
            <span className="block font-semibold text-slate-900">{name}</span>
            <span className="block text-xs text-slate-700">{roleLabel}</span>
          </span>
          <button type="submit" className="btn border-white bg-white text-brand">
            Sair
          </button>
        </form>
      </div>
      <div className="h-1 bg-brand" />
    </header>
  );
}
