import { isDemo } from "@/lib/supabase/env";

export default function DemoBanner() {
  if (!isDemo()) return null;
  return (
    <div className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
      Modo demonstração: dados fictícios, só para testar o visual. Tudo volta ao início quando o site
      é reiniciado.
    </div>
  );
}
