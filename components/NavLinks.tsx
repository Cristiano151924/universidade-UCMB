"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; exact?: boolean };

export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="order-last flex w-full flex-wrap items-center gap-1 pb-2 text-sm md:order-none md:w-auto md:flex-1 md:pb-0">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "rounded-lg bg-white px-3 py-1.5 font-semibold text-brand shadow-sm"
                : "rounded-lg px-3 py-1.5 font-medium text-slate-800 transition hover:bg-white/60"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
